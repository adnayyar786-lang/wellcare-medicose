'use node'

import { v } from 'convex/values'

import { internalAction } from './_generated/server'

const APP_URL = 'https://macaly-bvngjnb4cw1qdnud5e9kc4hd-prod.macaly-app.com'

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Cash',
  online: 'Online (UPI/Card)',
  upi: 'UPI',
  card: 'Card',
  cod: 'Cash on Delivery',
  wallet: 'Wallet',
}

async function sendEmail(subject: string, message: string) {
  const endpoint = process.env.EMAIL_NOTIFICATION_ENDPOINT
  const recipient = process.env.RECIPIENT_EMAIL
  const chatId = process.env.CHAT_ID
  const appName = process.env.APP_NAME
  const secretKey = process.env.SECRET_KEY

  if (!endpoint || !recipient || !chatId || !appName || !secretKey) {
    console.error('Email notification env vars missing; skipping email')
    return
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toEmail: recipient, subject, message, chatId, appName, secretKey }),
    })
    const bodyText = await res.text()
    if (!res.ok) {
      console.error('Notification email failed', res.status, bodyText)
    } else {
      console.log('Notification email sent', res.status, bodyText)
    }
  } catch (err) {
    console.error('Notification email error', err)
  }
}

export const notifyNewOrder = internalAction({
  args: {
    orderId: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    fulfillment: v.union(v.literal('pickup'), v.literal('delivery')),
    deliveryAddress: v.optional(v.string()),
    paymentMethod: v.union(
      v.literal('cash'),
      v.literal('online'),
      v.literal('upi'),
      v.literal('card'),
      v.literal('cod'),
      v.literal('wallet'),
    ),
    total: v.number(),
    itemsSummary: v.string(),
  },
  returns: v.null(),
  handler: async (_ctx, args) => {
    const fulfillmentLabel = args.fulfillment === 'pickup' ? 'STORE PICKUP' : 'HOME DELIVERY'
    const paymentLabel = PAYMENT_LABEL[args.paymentMethod] ?? args.paymentMethod
    const lines = [
      `New order — ${fulfillmentLabel}`,
      '',
      `Customer: ${args.customerName}`,
      `Phone: ${args.customerPhone}`,
      args.fulfillment === 'delivery' && args.deliveryAddress
        ? `Delivery address: ${args.deliveryAddress}`
        : null,
      `Payment: ${paymentLabel}`,
      '',
      'Items:',
      args.itemsSummary,
      '',
      `Total: ₹${args.total.toFixed(2)}`,
      '',
      `Order ID: ${args.orderId}`,
      `Manage in admin: ${APP_URL}/admin`,
      `Customer tracking link: ${APP_URL}/track/${args.orderId}`,
    ].filter((l): l is string => l !== null)

    await sendEmail(`New order from ${args.customerName} (${fulfillmentLabel})`, lines.join('\n'))
    return null
  },
})

export const notifyOrderCancelled = internalAction({
  args: {
    orderId: v.string(),
    customerName: v.string(),
    total: v.number(),
    partial: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (_ctx, args) => {
    const lines = [
      args.partial ? 'Items cancelled from an order' : 'Order cancelled',
      '',
      `Customer: ${args.customerName}`,
      args.partial ? `Cancelled items: ${args.partial}` : null,
      `Refund/adjustment amount: ₹${args.total.toFixed(2)}`,
      '',
      `Order ID: ${args.orderId}`,
      `Manage in admin: ${APP_URL}/admin`,
    ].filter((l): l is string => l !== null)

    await sendEmail(
      args.partial ? `Items cancelled — ${args.customerName}` : `Order cancelled — ${args.customerName}`,
      lines.join('\n'),
    )
    return null
  },
})

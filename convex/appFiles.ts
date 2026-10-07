import { getAppUserId } from './appAuth'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { action, internalQuery, type ActionCtx } from './_generated/server'
import { callMacalyJson } from './macaly'

const APP_FILES_PROTOCOL = 'bindings_v1' as const

const uploadGrant = v.object({
  fileId: v.string(),
  uploadUrl: v.string(),
  method: v.literal('PUT'),
  headers: v.record(v.string(), v.string()),
  expiresAt: v.string(),
  maxBytes: v.number(),
})

export const getCurrentAppUserId = internalQuery({
  args: {},
  returns: v.id('users'),
  handler: async (ctx): Promise<Id<'users'>> => {
    const userId = await getAppUserId(ctx)
    if (!userId) throw new Error('Authentication required')
    return userId
  },
})

async function requireAppUserId(ctx: Pick<ActionCtx, 'runQuery'>): Promise<Id<'users'>> {
  return ctx.runQuery(internal.appFiles.getCurrentAppUserId, {})
}

export const createUpload = action({
  args: {
    filename: v.string(),
    contentType: v.string(),
    fileSize: v.number(),
    visibility: v.union(v.literal('public'), v.literal('private')),
  },
  returns: uploadGrant,
  handler: async (ctx, args) => {
    const appUserId = await requireAppUserId(ctx)
    const response = await callMacalyJson('/api/client-app/app-files/create-upload', {
      ...args,
      protocolVersion: APP_FILES_PROTOCOL,
      databaseEnvironment: process.env.MACALY_DATABASE_ENVIRONMENT === 'development' ? 'development' : 'production',
      appSubjectId: appUserId,
    })
    return response.upload as {
      fileId: string
      uploadUrl: string
      method: 'PUT'
      headers: Record<string, string>
      expiresAt: string
      maxBytes: number
    }
  },
})

export async function completeAppFile(ctx: Pick<ActionCtx, 'runQuery'>, fileId: string) {
  const appUserId = await requireAppUserId(ctx)
  const response = await callMacalyJson('/api/client-app/app-files/complete-upload', {
    fileId,
    protocolVersion: APP_FILES_PROTOCOL,
    databaseEnvironment: process.env.MACALY_DATABASE_ENVIRONMENT === 'development' ? 'development' : 'production',
    appSubjectId: appUserId,
  })
  return response.file as {
    fileId: string
    status: 'ready'
    contentType: string
    fileSize: number
    visibility: 'public' | 'private'
    url: string | null
  }
}

export const finalizeMedicineImage = action({
  args: { fileId: v.string(), medicineId: v.id('medicines') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const uploaded = await completeAppFile(ctx, args.fileId)
    await ctx.runMutation(internal.medicines.setImageUrlAndRegister, {
      id: args.medicineId,
      imageUrl: uploaded.url ?? undefined,
      source: 'admin-upload',
    })
    return null
  },
})

import config from '@payload-config'
import { getPayload } from 'payload'

export const payloadClient = async () => getPayload({ config })

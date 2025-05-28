/**
 * @file Defines the base schema.
 * @module baseSchema
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

import { logger } from '../config/winston.js'
import mongoose from 'mongoose'

// Options to use converting the document to a plain object and JSON.
const convertOptions = {
  getters: true, // Include getters and virtual properties.
  /**
   * Transform the document and remove the properties that should not be sent to the client.
   *
   * @param {object} doc - The mongoose document which is being converted.
   * @param {object} ret - The plain object representation which has been converted.
   * @returns {object} The transformed object.
   */
  transform: (doc, ret) => {
    logger.silly(`Transforming document: ${doc._id}`)
    delete ret._id
    delete ret.__v
    logger.silly(`Transformed document: ${doc._id}`)
    return ret
  }
}

// Create a schema using timestamps and specified options when converting the document to a POJO (or DTO) or JSON.
// POJO = Plain Old JavaScript Object
const baseSchema = new mongoose.Schema({}, {
  timestamps: true,
  toObject: convertOptions,
  toJSON: convertOptions
})

export const BASE_SCHEMA = Object.freeze(baseSchema)

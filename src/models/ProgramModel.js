/**
 * @file Defines the program model.
 * @module ProgramModel
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

import mongoose from 'mongoose'
import { BASE_SCHEMA } from './baseSchema.js'

// Create a schema.
const schema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 1
  },
  description: {
    type: String
  },
  creator: {
    type: String,
    required: true,
    minlength: 1
  }
})

schema.add(BASE_SCHEMA)

/**
 * Fetches documents that match a given search parameter.
 *
 * @param {string} query - The parameter to search for.
 * @returns {Document[]} - The documents matching the search parameter.
 */
schema.statics.search = async function (query) {
  const programDocument = await this.find({ creator: query })
  return programDocument
}

// Create a model using the schema.
export const ProgramModel = mongoose.model('Program', schema)

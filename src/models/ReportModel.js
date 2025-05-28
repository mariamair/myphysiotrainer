/**
 * @file Defines the report model.
 * @module ReportModel
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

import mongoose from 'mongoose'
import { BASE_SCHEMA } from './baseSchema.js'

// Create a schema.
const schema = new mongoose.Schema({
  programId: {
    type: String,
    required: true,
    minlength: 1
  },
  programTitle: {
    type: String,
    required: true,
    minlength: 1
  },
  exerciseId: {
    type: String,
    required: true,
    minlength: 1
  },
  exerciseTitle: {
    type: String,
    required: true,
    minlength: 1
  },
  executedRepetitions: {
    type: Number
  },
  repetitionMethod: {
    type: { type: String },
    number: { type: Number }
  },
  user: {
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
  const reportDocument = await this.find({ user: query })
  return reportDocument
}

// Create a model using the schema.
export const ReportModel = mongoose.model('Report', schema)

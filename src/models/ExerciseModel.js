/**
 * @file Defines the exercise model.
 * @module ExerciseModel
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
  title: {
    type: String,
    required: true,
    minlength: 1
  },
  startingPosition: {
    type: String,
    required: true,
    minlength: 1
  },
  steps: {
    type: [String],
    required: true,
    minlength: 1
  },
  repetitions: {
    type: Number
  },
  repetitionMethod: {
    type: { type: String },
    number: { type: Number }
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
  const exerciseDocument = await this.find({
    $and: [
      { programId: query.programId },
      { creator: query.userId }
    ]
  })
  return exerciseDocument
}

// Create a model using the schema.
export const ExerciseModel = mongoose.model('Exercise', schema)

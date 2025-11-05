/**
 * @file Defines the account model.
 * @module AccountModel
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

import http from 'node:http'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { BASE_SCHEMA } from './baseSchema.js'

// Create a schema.
const schema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    // Set username requirements and length.
    match: [/^[A-Za-z][A-Za-z0-9_-]{2,255}$/, 'Please provide a valid username.']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [10, 'The password must be at least 10 characters.'],
    maxLength: [256, 'The password cannot be longer than 256 characters.']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    minLength: [1, 'The first name must be at least 1 character.'],
    maxLength: [256, 'The first name cannot be longer than 256 characters.']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    minLength: [1, 'The last name must be at least 1 character.'],
    maxLength: [256, 'The last name cannot be longer than 256 characters.']
  },
  email: {
    type: String,
    required: true,
    maxLength: [254, 'The email address cannot be longer than 256 characters.']
  },
  isAdmin: {
    type: Boolean,
    default: false,
    immutable: true
  }
})

schema.add(BASE_SCHEMA)

schema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10)
  }
})

/**
 * Authenticate a user.
 *
 * @param {string} username - The username included in the request.
 * @param {string} password - The password included in the request.
 * @returns {Document} - A user document.
 */
schema.statics.authenticate = async function (username, password) {
  const accountDocument = await this.findOne({ username })

  // If user found, compare the supplied password with the stored password hash.
  // Otherwise, use a dummy hash to prevent timing attacks.
  const dummyPasswordHash = await bcrypt.hash(password, 10)
  const suppliedPasswordHash = accountDocument ? accountDocument.password : dummyPasswordHash
  const passwordMatch = await bcrypt.compare(password, suppliedPasswordHash)

  // If no user found or password is wrong, throw an error.
  if (!accountDocument || !passwordMatch) {
    const httpStatusCode = 401
    const error = new Error(http.STATUS_CODES[httpStatusCode])
    error.status = httpStatusCode
    throw error
  }

  // User found, and password correct, return the user.
  return accountDocument
}

// Create a model using the schema.
export const AccountModel = mongoose.model('Account', schema)

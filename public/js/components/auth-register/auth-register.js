/**
 * The auth register component module.
 *
 * @module auth-register
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

const template = document.createElement('template')
template.innerHTML = `
<link rel="stylesheet" href="./css/styles.css">
<style>
  input['input[type=email]:invalid'] {
    color: red;
  }
</style>
<div class="wrapper">
  <h1>Register</h1>
  <form id="register-form">
    <label for="first-name">First name</label>
    <input type="text" id="first-name" placeholder="Enter your first name" required>
    <label for="last-name">Last name</label>
    <input type="text" id="last-name" placeholder="Enter your last name" required>
    <label for="email">E-mail</label>
    <input type="email" id="email" placeholder="Enter your email" required oninvalid="setCustomValidity('Please enter a valid email address.')">
    <label for="username">Username</label>
    <input type="text" id="username" placeholder="Enter a username" required>
    <label for="password">Password</label>
    <input type="password" id="password" placeholder="Enter a password" required>
    <button type="submit" id="action-button">Register</button>
</form>
</div>
`

customElements.define('auth-register',
  /**
   * Represents an auth register component.
   */
  class extends HTMLElement {
    #abortController
    #accountApiUrl

    /**
     * Creates an instance of the current class.
     */
    constructor () {
      super()
      this.attachShadow({ mode: 'open' })
        .appendChild(template.content.cloneNode(true))

      // Add an abort controller to be able to remove event listeners
      this.#abortController = new AbortController()
    }

    /**
     * Called after the element is added to the DOM.
     */
    connectedCallback () {
      this.shadowRoot.querySelector('#action-button').addEventListener('click', (event) => {
        event.preventDefault()
        this.#saveUserAccount(
          this.shadowRoot.querySelector('#first-name').value,
          this.shadowRoot.querySelector('#last-name').value,
          this.shadowRoot.querySelector('#email').value,
          this.shadowRoot.querySelector('#username').value,
          this.shadowRoot.querySelector('#password').value
        )
      }, {
        signal: this.#abortController.signal
      })
    }

    /**
     * Called after the element is removed from the DOM.
     */
    disconnectedCallback () {
      this.#abortController.abort()
    }

    /**
     * Set the element's data.
     *
     * @param {string} accountApiUrl - Program API url.
     */
    setData (accountApiUrl) {
      this.#accountApiUrl = accountApiUrl + 'register'
    }

    /**
     * Send the account information to the server.
     *
     * @param {string} firstName - The user's first name.
     * @param {string} lastName - The user's last name.
     * @param {string} email - The user's email.
     * @param {string} username - The user's username.
     * @param {string} password - The user's password.
     */
    async #saveUserAccount (firstName, lastName, email, username, password) {
      try {
        this.#checkValidEmail(email)
        const res = await window.fetch(this.#accountApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            username,
            password
          })
        })

        const data = await res.json()

        if (!res.ok) {
          const error = new Error(data.statusMessage)
          error.statusCode = data.statusCode
          error.statusMessage = data.statusMessage
          error.message = data.message
          throw error
        }

        this.dispatchEvent(new CustomEvent('account-created', {
          bubbles: true,
          detail: { text: 'Your user account was created successfully. Start by logging in with your credentials.' }
        }))
      } catch (error) {
        this.dispatchEvent(new CustomEvent('error', {
          detail: {
            statusCode: error.statusCode,
            statusMessage: error.statusMessage,
            message: error.message
          },
          bubbles: true,
          composed: true
        }))
      }
    }

    /**
     * Check if the email address is valid.
     *
     * @param {string} email - The user's email.
     */
    #checkValidEmail (email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      re.test(email)

      if (!re.test(email)) {
        const error = new Error('Bad request')
        error.statusCode = 400
        error.statusMessage = 'Bad request'
        error.message = 'Invalid e-mail address'
        throw error
      }
    }
  }
)

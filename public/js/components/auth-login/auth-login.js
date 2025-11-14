/**
 * The auth login component module.
 *
 * @module auth-login
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

const template = document.createElement('template')
template.innerHTML = `
<link rel="stylesheet" href="./css/styles.css">
<style>
  .alert {
    color: #02FF6B;
  }

  .link {
    border: none;
    background-color: var(--background);
    font-size: 1rem;
    width: auto;
    margin-top: 0;
    padding: 0;
  }
</style>
<div class="wrapper">
  <h1>Login</h1>
  <p id="information-text">Login to your user account or <button type="button" id="register-link" class="link">register as a new user</button>.</p>
  <form id="login-form">
    <label for="username">Username</label>
    <input type="text" id="username" placeholder="Enter your username" required>
    <label for="password">Password</label>
    <input type="password" id="password" placeholder="Enter your password" required>
    <button type="submit" id="action-button">Login</button>
</form>
</div>
`

customElements.define('auth-login',
  /**
   * Represents an auth login component.
   */
  class extends HTMLElement {
    #abortController
    #loginApiUrl

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
        this.#loginUser(
          this.shadowRoot.querySelector('#username').value,
          this.shadowRoot.querySelector('#password').value
        )
      }, {
        signal: this.#abortController.signal
      })

      if (this.shadowRoot.querySelector('#register-link')) {
        this.shadowRoot.querySelector('#register-link').addEventListener('click', (event) => {
          this.dispatchEvent(new CustomEvent('register-form-requested', {
            bubbles: true
          }))
        }, {
          signal: this.#abortController.signal
        })
      }
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
     * @param {string} textToDisplay - The information text to display.
     */
    setData (accountApiUrl, textToDisplay) {
      this.#loginApiUrl = accountApiUrl + 'login'
      if (textToDisplay) {
        this.shadowRoot.querySelector('#information-text').textContent = textToDisplay
        this.shadowRoot.querySelector('#information-text').classList.add('alert')
      }
    }

    /**
     * Log in the user.
     *
     * @param {string} username - The user's username.
     * @param {string} password - The user's password.
     */
    async #loginUser (username, password) {
      try {
        const res = await window.fetch(this.#loginApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
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

        this.dispatchEvent(new CustomEvent('logged-in', {
          bubbles: true,
          detail: {
            firstName: data.firstName,
            userId: data.userId,
            isAdmin: data.isAdmin
          }
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
  }
)

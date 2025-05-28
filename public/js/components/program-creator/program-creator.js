/**
 * The program creator module.
 *
 * @module program-creator
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

const template = document.createElement('template')
template.innerHTML = `
<link rel="stylesheet" href="./css/styles.css">
<style>
  h1 {
    padding-bottom: 10px;
    border-bottom: 1px solid var(--light-blue);
  }

  .wrapper {
    border-radius: 10px 10px 0 0;
    background-color:var(--module-var1);
    padding: 20px;
  }
</style>
<div class="wrapper">
  <h1 id="title">Add training program</h1>
  <form id="program-form">
    <label for="program-title">Program for</label>
    <input type="text" id="program-title" placeholder="Enter body part or program title" required>
    <label for="program-description">Description</label>
    <input type="text" id="program-description" placeholder="Enter a description (optional)">
    <button type="submit" id="action-button">Add program</button>
  </form>
</div>
`

customElements.define('program-creator',
  /**
   * Represents a program creator element.
   */
  class extends HTMLElement {
    #abortController
    #form
    #programApiUrl
    #programDescription
    #programTitle

    /**
     * Creates an instance of the current type.
     */
    constructor () {
      super()
      this.attachShadow({ mode: 'open' })
        .appendChild(template.content.cloneNode(true))

      this.#form = this.shadowRoot.querySelector('#program-form')
      this.#programTitle = this.shadowRoot.querySelector('#program-title')
      this.#programDescription = this.shadowRoot.querySelector('#program-description')

      // Add an abort controller to be able to remove event listeners
      this.#abortController = new AbortController()
    }

    /**
     * Called after the element is added to the DOM.
     */
    connectedCallback () {
      this.#form.addEventListener('submit', (event) => {
        event.preventDefault()
        this.#saveProgram()
        this.#form.reset()
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
     * @param {string} programApiUrl - Program API url.
     */
    setData (programApiUrl) {
      this.#programApiUrl = programApiUrl
    }

    /**
     * Send the program information to the server.
     */
    async #saveProgram () {
      try {
        const res = await window.fetch(this.#programApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: this.#programTitle.value,
            description: this.#programDescription.value
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

        const programCreatedEvent = new window.CustomEvent('program-created', {
          bubbles: true,
          detail: data.id
        })
        this.dispatchEvent(programCreatedEvent)
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

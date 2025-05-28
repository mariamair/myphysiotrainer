/**
 * The program list module.
 *
 * @module program-list
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

const template = document.createElement('template')
template.innerHTML = `
<link rel="stylesheet" href="./css/styles.css">
<style>
  .list-item {
  background-color: #E0E5E8;
  color: #000;
  }
</style>
<template id="list-item-template">
  <button id="program" type="button" class="list-item"></button>
</template>
<div class="wrapper">
  <h1>Training programs</h1>
  <div id="program-list" class="list"></div>
  <button type="button" id="action-button">Add training program</button>
</div>
`

customElements.define('program-list',
  /**
   * Represents a program list element.
   */
  class extends HTMLElement {
    #abortController
    #button
    #list
    #listItemTemplate
    #programApiUrl

    /**
     * Creates an instance of the current type.
     */
    constructor () {
      super()
      this.attachShadow({ mode: 'open' })
        .appendChild(template.content.cloneNode(true))

      this.#button = this.shadowRoot.querySelector('#action-button')
      this.#list = this.shadowRoot.querySelector('#program-list')
      this.#listItemTemplate = this.shadowRoot.querySelector('#list-item-template')

      // Add an abort controller to be able to remove event listeners
      this.#abortController = new AbortController()
    }

    /**
     * Called after the element is added to the DOM.
     */
    connectedCallback () {
      this.#displayTrainingPrograms()

      this.#button.addEventListener('click', (event) => {
        this.dispatchEvent(new CustomEvent('program-creator-requested', {
          bubbles: true
        }))
      }, {
        signal: this.#abortController.signal
      })

      this.#list.addEventListener('click', (event) => {
        this.dispatchEvent(new CustomEvent('program-display-requested', {
          bubbles: true,
          detail: {
            programId: event.target.getAttribute('data-program-id')
          }
        }))
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
     * Fetch training programs from the database.
     *
     * @returns {Promise<object[]>} - An array of training program objects.
     */
    async #getTrainingPrograms () {
      try {
        const res = await window.fetch(this.#programApiUrl, {
          credentials: 'include'
        })

        const data = await res.json()

        if (!res.ok) {
          const error = new Error(data.statusMessage)
          error.statusCode = data.statusCode
          error.statusMessage = data.statusMessage
          error.message = data.message
          throw error
        }

        return data
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
     * Add all training programs to the list.
     */
    async #displayTrainingPrograms () {
      const programs = await this.#getTrainingPrograms()

      if (Array.isArray(programs) && programs.length > 0) {
        for (const program of programs) {
          const listItem = this.#listItemTemplate.content.cloneNode(true)
          listItem.firstElementChild.setAttribute('data-program-id', program.id)
          listItem.firstElementChild.textContent = program.title
          this.#list.appendChild(listItem)
        }
      }
    }
  }
)

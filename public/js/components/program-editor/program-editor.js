/**
 * The program editor module.
 *
 * @module program-editor
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

  .list {
    margin-top: 30px;
  }

  .list-item {
    background-color: #76DDE0;
    color: #373535;
  }

  #exercise {
    border-color: var(--border-to-light-blue);
  }
</style>
<template id="list-item-template">
  <button id="exercise" type="button" class="list-item"></button>
</template>
<div class="wrapper">
  <h1 id="title">Editing training program</h1>
  <form id="program-form">
    <label for="program-title">Title</label>
    <input type="text" id="program-title" required>
    <label for="program-description">Description</label>
    <input type="text" id="program-description" placeholder="Enter a description (optional)">
    <div id="exercise-list" class="list">
      <h2>Exercises</h2>
      <button type="button" id="action-button">Add exercise</button>
    </div>
    <button type="submit" id="save-button">Save program</button>
  </form>
</div>
`

customElements.define('program-editor',
  /**
   * Represents a program editor element.
   */
  class extends HTMLElement {
    #abortController
    #addButton
    #exerciseApiUrl
    #list
    #listItemTemplate
    #programApiUrl
    #programDescription
    #programId
    #programTitle
    #saveButton

    /**
     * Creates an instance of the current type.
     */
    constructor () {
      super()
      this.attachShadow({ mode: 'open' })
        .appendChild(template.content.cloneNode(true))

      // Get the elements in the shadow root.
      this.#addButton = this.shadowRoot.querySelector('#action-button')
      this.#saveButton = this.shadowRoot.querySelector('#save-button')
      this.#list = this.shadowRoot.querySelector('#exercise-list')
      this.#listItemTemplate = this.shadowRoot.querySelector('#list-item-template')
      this.#programDescription = this.shadowRoot.querySelector('#program-description')
      this.#programTitle = this.shadowRoot.querySelector('#program-title')

      // Add an abort controller to be able to remove event listeners
      this.#abortController = new AbortController()
    }

    /**
     * Called after the element is added to the DOM.
     */
    connectedCallback () {
      this.#displayProgramInformation()
      this.#displayExercises()

      this.#addButton.addEventListener('click', (event) => {
        this.dispatchEvent(new CustomEvent('exercise-editor-requested', {
          bubbles: true,
          detail: {
            programId: this.#programId,
            exerciseId: ''
          }
        }))
      }, {
        signal: this.#abortController.signal
      })

      this.#list.addEventListener('click', (event) => {
        this.dispatchEvent(new CustomEvent('exercise-editor-requested', {
          bubbles: true,
          detail: {
            programId: this.#programId,
            exerciseId: event.target.getAttribute('data-exercise-id')
          }
        }))
      }, {
        signal: this.#abortController.signal
      })

      this.#saveButton.addEventListener('click', async (event) => {
        event.preventDefault()
        this.#updateProgram()
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
     * @param {string} programApiUrl - The url of the program API.
     * @param {string} programId - The id of the training program.
     */
    setData (programApiUrl, programId) {
      this.#programApiUrl = programApiUrl
      this.#programId = programId
      this.#exerciseApiUrl = this.#programApiUrl + this.#programId + '/exercises'
    }

    /**
     * Fetch training program information from the database.
     *
     * @returns {object} - A training program object.
     */
    async #getProgramInformation () {
      try {
        const res = await window.fetch(this.#programApiUrl + this.#programId, {
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

        return {
          title: data.title,
          description: data.description
        }
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
     * Display training program information.
     */
    async #displayProgramInformation () {
      const program = await this.#getProgramInformation()

      this.#programTitle.value = program.title
      this.#programDescription.value = program.description
    }

    /**
     * Fetch exercises from the database.
     *
     * @returns {Promise<object[]>} - An array of exercise objects.
     */
    async #getExercises () {
      try {
        const res = await window.fetch(this.#exerciseApiUrl, {
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
     * Add all exercises to the list.
     */
    async #displayExercises () {
      const exercises = await this.#getExercises()

      for (const exercise of exercises) {
        const listItem = this.#listItemTemplate.content.cloneNode(true)
        listItem.firstElementChild.setAttribute('data-exercise-id', exercise.id)
        listItem.firstElementChild.textContent = exercise.title
        this.#list.insertBefore(listItem, this.#addButton)
      }
    }

    /**
     * Send the updated program information to the server.
     */
    async #updateProgram () {
      try {
        const url = this.#programApiUrl + this.#programId
        const res = await window.fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: this.#programTitle.value,
            description: this.#programDescription.value
          })
        })

        if (!res.ok) {
          const data = await res.json()
          const error = new Error(data.statusMessage)
          error.statusCode = data.statusCode
          error.statusMessage = data.statusMessage
          error.message = data.message
          throw error
        }

        this.dispatchEvent(new CustomEvent('program-updated', {
          bubbles: true,
          detail: this.#programId
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

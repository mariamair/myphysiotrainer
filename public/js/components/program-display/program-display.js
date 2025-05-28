/**
 * The program display module.
 *
 * @module program-display
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

import '../exercise-display/index.js'

const template = document.createElement('template')
template.innerHTML = `
<link rel="stylesheet" href="./css/styles.css">
<style>
  h1 {
    padding-bottom: 10px;
    border-bottom: 1px solid var(--light-blue);
  }

  p {
    margin-top: 10px;
    background-color: var(--module-var1);
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
    border-style: none;
  }

  #action-buttons {
    display: flex;
    justify-content: space-between;
  }
  
  #edit-button {
    display: block;
  }

  .hidden {
    display: none;
  }
</style>
<template id="list-item-template">
  <button id="exercise" type="button" class="list-item"></button>
</template>
<div class="wrapper">
  <h1 id="program-title"></h1>
  <div id="inner-wrapper">
    <h2>Description</h2>
    <p id="program-description"></p>
    <div id="exercise-list" class="list">
      <h2>Exercises</h2>
    </div>
    <div id="action-buttons">
      <button type="button" id="edit-button" class="editing-button">Edit</button>
      <button type="button" id="delete-button" class="editing-button">Delete</button>
    </div>
    <button type="button" id="run-button" class="hidden">&gt&gt Run program</button>
  </div>
</div>
`

customElements.define('program-display',
  /**
   * Represents a program display element.
   */
  class extends HTMLElement {
    #abortController
    #exerciseList
    #innerWrapper
    #list
    #listItemTemplate
    #programApiUrl
    #programId
    #programTitle
    #reportApiUrl

    /**
     * Creates an instance of the current type.
     */
    constructor () {
      super()
      this.attachShadow({ mode: 'open' })
        .appendChild(template.content.cloneNode(true))

      // Get the elements in the shadow root.
      this.#innerWrapper = this.shadowRoot.querySelector('#inner-wrapper')
      this.#list = this.shadowRoot.querySelector('#exercise-list')
      this.#listItemTemplate = this.shadowRoot.querySelector('#list-item-template')

      // Add an abort controller to be able to remove event listeners
      this.#abortController = new AbortController()
    }

    /**
     * Called after the element is added to the DOM.
     */
    connectedCallback () {
      this.#displayProgramInformation()
      this.#displayExerciseList()

      this.#list.addEventListener('click', (event) => {
        this.#removeAllChildren()
        const exerciseId = event.target.getAttribute('data-exercise-id')
        this.#displayExerciseDisplay(exerciseId)
      }, {
        signal: this.#abortController.signal
      })

      this.shadowRoot.querySelector('#edit-button').addEventListener('click', (event) => {
        this.dispatchEvent(new CustomEvent('program-editor-requested', {
          bubbles: true,
          detail: this.#programId
        }))
      }, {
        signal: this.#abortController.signal
      })

      this.shadowRoot.querySelector('#delete-button').addEventListener('click', (event) => {
        this.#deleteProgram()
      }, {
        signal: this.#abortController.signal
      })

      this.shadowRoot.querySelector('#run-button').addEventListener('click', (event) => {
        this.#removeAllChildren()
        this.#displayExerciseDisplay(this.#exerciseList[0], 'run')
      }, {
        signal: this.#abortController.signal
      })

      this.shadowRoot.addEventListener('previous-exercise-requested', (event) => {
        event.preventDefault()
        this.#removeAllChildren()
        const previousExerciseId = this.#getPreviousExercise(event.detail.exerciseId)
        previousExerciseId ? this.#displayExerciseDisplay(previousExerciseId) : this.#reloadProgramDisplay()
      }, {
        signal: this.#abortController.signal
      })

      this.shadowRoot.addEventListener('next-exercise-requested', (event) => {
        event.preventDefault()
        this.#removeAllChildren()
        const nextExerciseId = this.#getNextExercise(event.detail.exerciseId)
        nextExerciseId ? this.#displayExerciseDisplay(nextExerciseId) : this.#reloadProgramDisplay()
      }, {
        signal: this.#abortController.signal
      })

      this.shadowRoot.addEventListener('exercise-executed', (event) => {
        event.preventDefault()
        this.#removeAllChildren()
        const nextExerciseId = this.#getNextExercise(event.detail.exerciseId)
        nextExerciseId ? this.#displayExerciseDisplay(nextExerciseId, 'run') : this.#displayConfirmation()
      }, {
        signal: this.#abortController.signal
      })

      this.shadowRoot.addEventListener('exercise-deleted', (event) => {
        this.#removeAllChildren()
        this.#reloadProgramDisplay()
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
     * @param {string} programApiUrl - The program API url.
     * @param {string} programId - The id of the program.
     * @param {string} reportApiUrl - The report API url.
     */
    setData (programApiUrl, programId, reportApiUrl) {
      this.#programApiUrl = programApiUrl
      this.#programId = programId
      this.#reportApiUrl = reportApiUrl
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

        this.#programTitle = data.title

        return {
          title: this.#programTitle,
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
     * Add training program information.
     */
    async #displayProgramInformation () {
      const data = await this.#getProgramInformation()

      this.shadowRoot.querySelector('#program-title').textContent = data.title
      this.shadowRoot.querySelector('#program-description').textContent = data.description
    }

    /**
     * Fetch exercises from the database.
     *
     * @returns {Promise<object[]>} - An array of exercise objects.
     */
    async #getExercises () {
      try {
        const exerciseApiUrl = this.#programApiUrl + this.#programId + '/exercises'
        const res = await window.fetch(exerciseApiUrl, {
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

        this.#exerciseList = data.map(exercise => exercise.id)

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
     * Get the id of the previous exercise.
     *
     * @param {string} exerciseId - The id of the current exercise.
     * @returns {*} - Th id of the previous exercise or null if there is no previouse exercise.
     */
    #getPreviousExercise (exerciseId) {
      const index = this.#exerciseList.indexOf(exerciseId)
      const previousExerciseId = index > 0 ? this.#exerciseList[index - 1] : null

      return previousExerciseId
    }

    /**
     * Get the id of the next exercise.
     *
     * @param {string} exerciseId - The id of the current exercise.
     * @returns {*} - Th id of the next exercise or null if there is no next exercise.
     */
    #getNextExercise (exerciseId) {
      const index = this.#exerciseList.indexOf(exerciseId)
      const nextExerciseId = index !== -1 && index < this.#exerciseList.length - 1 ? this.#exerciseList[index + 1] : null

      return nextExerciseId
    }

    /**
     * Add all exercises to the list.
     */
    async #displayExerciseList () {
      const exercises = await this.#getExercises()

      for (const exercise of exercises) {
        const listItem = this.#listItemTemplate.content.cloneNode(true)
        listItem.firstElementChild.setAttribute('data-exercise-id', exercise.id)
        listItem.firstElementChild.textContent = exercise.title
        this.#list.appendChild(listItem)
      }

      if (this.#exerciseList.length > 0) {
        this.shadowRoot.querySelector('#run-button').classList.remove('hidden')
      }
    }

    /**
     * Display the exercise display.
     *
     * @param {string} exerciseId - The id of the exercise.
     * @param {string} mode - The mode of the exercise display.
     */
    #displayExerciseDisplay (exerciseId, mode) {
      const exerciseDisplay = document.createElement('exercise-display')
      exerciseDisplay.setData(this.#programApiUrl, this.#programId, this.#programTitle, exerciseId, mode, this.#reportApiUrl)
      this.#innerWrapper.appendChild(exerciseDisplay)
    }

    /**
     * Display confirmation when program run is finished.
     */
    #displayConfirmation () {
      const p = document.createElement('p')
      p.textContent = 'Well done!'
      this.#innerWrapper.appendChild(p)
    }

    /**
     * Reload this component.
     */
    #reloadProgramDisplay () {
      this.dispatchEvent(new CustomEvent('program-display-requested', {
        bubbles: true,
        detail: { programId: this.#programId }
      }))
    }

    /**
     * Helper method to remove all children from DOM.
     */
    #removeAllChildren () {
      while (this.#innerWrapper.firstChild) {
        this.#innerWrapper.removeChild(this.#innerWrapper.firstChild)
      }
    }

    /**
     * Delete the program.
     */
    async #deleteProgram () {
      try {
        const exerciseApiUrl = this.#programApiUrl + this.#programId
        const res = await fetch(exerciseApiUrl, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        if (!res.ok) {
          const data = await res.json()
          const error = new Error(data.statusMessage)
          error.statusCode = data.statusCode
          error.statusMessage = data.statusMessage
          error.message = data.message
          throw error
        }

        this.dispatchEvent(new CustomEvent('program-deleted', {
          bubbles: true,
          detail: {
            programId: this.#programId
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

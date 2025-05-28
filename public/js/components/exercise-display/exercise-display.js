/**
 * The exercise display module.
 *
 * @module exercise-display
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

  h2 {
    color: var(--background);
  }

  .card {
    border-radius: 10px;
    background-color: #FFF;
    color: var(--background);
    padding: 20px;
  }

  #steps {
    border-top: 1px solid #8D8C8C;
    border-bottom: 1px solid #8D8C8C;
    padding-bottom: 10px;
  }

  ul {
    margin: 0;
    padding: 10px;
  }

  li {
    list-style-type: none;
  }

  input, label {
    display: inline;
  }

  input {
    width: 28px;
    height: 28px;
    margin-right: 10px;
  }

  input:checked {
    accent-color: var(--light-blue);
  }

  #repetitions {
    font-weight: bold;
  }

  #action-buttons, #navigation-buttons {
    display: flex;
    justify-content: space-between;
  }

  #previous-button, #next-button {
    width: 150px;
  }

  .hidden {
    display: none;
  }
</style>
<template id="exercise-steps-template">
  <p id="exercise-steps"></p>
</template>
<template id="repetition-item-template">
  <li><input type="checkbox" id="executed-repetitions" name="executed-repetitions" value="10"><label for="executed-repetitions">10 lifts</label></li>
</template>
<div class="card">
  <h2 id="exercise-title"></h2>
  <h3>Starting position</h3>
  <p id="starting-position"></p>
  <div id="steps">
    <h3>Exercise</h3>
  </div>
  <p id="repetitions"></p>
</div>
<div id="action-buttons">
  <button type="button" id="edit-button" class="editing-button">Edit</button>
  <button type="button" id="delete-button" class="editing-button">Delete</button>
</div>
<div id="navigation-buttons">
  <button type="button" id="previous-button">&lt Previous</button>
  <button type="button" id="next-button">Next &gt</button>
</div>
<form id="repetitions-form" class="hidden">
    <ul id="repetitions-list"></ul>
    <button type="submit" id="submit-repetitions-button">&gt&gt Next exercise</button>
</form>
`

customElements.define('exercise-display',
  /**
   * Represents an exercise display element.
   */
  class extends HTMLElement {
    #abortController
    #exerciseId
    #exerciseStepsTemplate
    #exerciseTitle
    #mode
    #programId
    #programApiUrl
    #programTitle
    #repetitionsForm
    #repetitionItemTemplate
    #repetitionMethod
    #reportApiUrl
    #steps

    /**
     * Creates an instance of the current type.
     */
    constructor () {
      super()
      this.attachShadow({ mode: 'open' })
        .appendChild(template.content.cloneNode(true))

      this.#exerciseStepsTemplate = this.shadowRoot.querySelector('#exercise-steps-template')
      this.#repetitionsForm = this.shadowRoot.querySelector('#repetitions-form')
      this.#repetitionItemTemplate = this.shadowRoot.querySelector('#repetition-item-template')
      this.#steps = this.shadowRoot.querySelector('#steps')

      // Add an abort controller to be able to remove event listeners
      this.#abortController = new AbortController()
    }

    /**
     * Called after the element is added to the DOM.
     */
    connectedCallback () {
      this.#displayExerciseInformation()

      if (this.#mode === 'run') {
        this.#displayRunMode()
      }

      this.shadowRoot.querySelector('#edit-button').addEventListener('click', (event) => {
        this.#requestExerciseEditor()
      }, {
        signal: this.#abortController.signal
      })

      this.shadowRoot.querySelector('#delete-button').addEventListener('click', (event) => {
        this.#deleteExercise()
      }, {
        signal: this.#abortController.signal
      })

      this.shadowRoot.querySelector('#previous-button').addEventListener('click', (event) => {
        this.#requestPreviousExercise()
      }, {
        signal: this.#abortController.signal
      })

      this.shadowRoot.querySelector('#next-button').addEventListener('click', (event) => {
        this.#requestNextExercise()
      }, {
        signal: this.#abortController.signal
      })

      this.#repetitionsForm.addEventListener('submit', (event) => {
        event.preventDefault()
        this.#saveStatistics()
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
     * Sets the element's data.
     *
     * @param {string} programApiUrl - Program API url.
     * @param {string} programId - The id of the program.
     * @param {string} programTitle - The title of the program.
     * @param {string} exerciseId - The id of the exercise.
     * @param {string} mode - The mode of the exercise display ('run' or 'display').
     * @param {string} reportApiUrl - Report API url.
     */
    setData (programApiUrl, programId, programTitle, exerciseId, mode, reportApiUrl) {
      this.#programApiUrl = programApiUrl
      this.#programId = programId
      this.#programTitle = programTitle
      this.#exerciseId = exerciseId
      this.#mode = mode
      this.#reportApiUrl = reportApiUrl
    }

    /**
     * Display exercise in 'run' mode.
     */
    #displayRunMode () {
      this.#repetitionsForm.classList.remove('hidden')
      this.shadowRoot.querySelector('#edit-button').classList.add('hidden')
      this.shadowRoot.querySelector('#delete-button').classList.add('hidden')
      this.shadowRoot.querySelector('#previous-button').classList.add('hidden')
      this.shadowRoot.querySelector('#next-button').classList.add('hidden')
    }

    /**
     * Fetch exercise information from the database.
     *
     * @returns {object} - An exercise object.
     */
    async #getExerciseInformation () {
      try {
        const exerciseApiUrl = this.#programApiUrl + this.#programId + '/exercises/' + this.#exerciseId

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

        this.#repetitionMethod = data.repetitionMethod
        this.#exerciseTitle = data.title

        return {
          title: this.#exerciseTitle,
          startingPosition: data.startingPosition,
          steps: data.steps,
          repetitions: data.repetitions,
          repetitionMethod: this.#repetitionMethod
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
     * Display exercise information.
     */
    async #displayExerciseInformation () {
      const exercise = await this.#getExerciseInformation()

      this.shadowRoot.querySelector('#exercise-title').textContent = exercise.title
      this.shadowRoot.querySelector('#starting-position').textContent = exercise.startingPosition

      const exerciseSteps = exercise.steps.filter(str => str !== '')
      for (let i = 0; i < exerciseSteps.length; i++) {
        const exerciseStep = this.#exerciseStepsTemplate.content.cloneNode(true)
        exerciseStep.firstElementChild.textContent = `${i + 1}. ` + exerciseSteps[i]
        this.#steps.appendChild(exerciseStep)
      }

      this.shadowRoot.querySelector('#repetitions').textContent = 'Repetitions: ' + exercise.repetitions + ' x ' + exercise.repetitionMethod.number + ' ' + exercise.repetitionMethod.type

      const repetitions = parseInt(exercise.repetitions)
      for (let i = 0; i < repetitions; i++) {
        const repetitionItem = this.#repetitionItemTemplate.content.cloneNode(true)
        repetitionItem.firstElementChild.querySelector('input').setAttribute('value', exercise.repetitionMethod.number)
        repetitionItem.firstElementChild.querySelector('label').textContent = exercise.repetitionMethod.number + ' ' + exercise.repetitionMethod.type
        this.shadowRoot.querySelector('#repetitions-list').appendChild(repetitionItem)
      }
    }

    /**
     * Save information about the executed repetitions.
     */
    async #saveStatistics () {
      try {
        const executedRepetitions = this.#repetitionsForm.querySelectorAll('input[name=executed-repetitions]:checked').length

        const res = await window.fetch(this.#reportApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            programId: this.#programId,
            programTitle: this.#programTitle,
            exerciseId: this.#exerciseId,
            exerciseTitle: this.#exerciseTitle,
            executedRepetitions,
            repetitionMethod: this.#repetitionMethod
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

        this.dispatchEvent(new CustomEvent('exercise-executed', {
          bubbles: true,
          detail: {
            programId: this.#programId,
            exerciseId: this.#exerciseId
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

    /**
     * Request display of the previous exercise.
     */
    #requestPreviousExercise () {
      this.dispatchEvent(new CustomEvent('previous-exercise-requested', {
        bubbles: true,
        detail: {
          exerciseId: this.#exerciseId
        }
      }))
    }

    /**
     * Request display of the next exercise.
     */
    #requestNextExercise () {
      this.dispatchEvent(new CustomEvent('next-exercise-requested', {
        bubbles: true,
        detail: {
          exerciseId: this.#exerciseId
        }
      }))
    }

    /**
     * Request the exercise editor.
     */
    #requestExerciseEditor () {
      this.dispatchEvent(new CustomEvent('exercise-editor-requested', {
        bubbles: true,
        composed: true,
        detail: {
          programId: this.#programId,
          exerciseId: this.#exerciseId
        }
      }))
    }

    /**
     * Delete the exercise.
     */
    async #deleteExercise () {
      try {
        const exerciseApiUrl = this.#programApiUrl + this.#programId + '/exercises/' + this.#exerciseId
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

        this.dispatchEvent(new CustomEvent('exercise-deleted', {
          bubbles: true,
          detail: {
            programId: this.#programId,
            exerciseId: this.#exerciseId
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

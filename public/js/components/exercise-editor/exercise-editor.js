/**
 * The exercise editor module.
 *
 * @module exercise-editor
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
    background-color:var(--module-var2);
    padding: 20px;
  }

  #repetition-container > * {
    display: inline;
  }

  #repetitions, #repetition-method-number {
    width: 40px;
  }

  #repetition-method-type {
    width: 140px;
  }

  #times {
    color: var(--light-blue);
    padding: 10px;
  }
</style>
<div class="wrapper">
  <h1 id="title">Adding exercise</h1>
  <form id="exercise-form">
    <label for="exercise-title">Exercise title</label>
    <input type="text" id="exercise-title" placeholder="Enter a title" required>
    <label for="starting-position">Starting position</label>
    <input type="text"id="starting-position" placeholder="Enter starting position" required>
    <label for="exercise-steps">Exercise steps</label>
    <div id="exercise-steps"></div>
    <input type="text" id="step-1" placeholder="Step 1" required>
    <input type="text" id="step-2" placeholder="Step 2">
    <input type="text" id="step-3" placeholder="Step 3">
    <label for="repetitions">Repetitions</label>
    <div id="repetition-container">
      <input type="number"id="repetitions" value="3" min="1" max="100">
      <p id="times">times</p>
      <input type="number"id="repetition-method-number" value="10" min="1" max="100">
      <input type="text"id="repetition-method-type" value="lifts">
    </div>
    <button type="submit" id="action-button">Add exercise</button>
  </form>
</div>
`

customElements.define('exercise-editor',
  /**
   * Represents an exercise editor element.
   */
  class extends HTMLElement {
    #abortController
    #button
    #exerciseId
    #exerciseRepetitionMethodNumber
    #exerciseRepetitionMethodType
    #exerciseRepetitions
    #exerciseStartingPosition
    #exerciseSteps = []
    #exerciseTitle
    #heading
    #isExistingExercise = false
    #form
    #programId
    #programApiUrl

    /**
     * Creates an instance of the current type.
     */
    constructor () {
      super()
      this.attachShadow({ mode: 'open' })
        .appendChild(template.content.cloneNode(true))

      this.#heading = this.shadowRoot.querySelector('#title')
      this.#form = this.shadowRoot.querySelector('#exercise-form')
      this.#exerciseTitle = this.shadowRoot.querySelector('#exercise-title')
      this.#exerciseStartingPosition = this.shadowRoot.querySelector('#starting-position')
      this.#exerciseSteps.push(this.shadowRoot.querySelector('#step-1'))
      this.#exerciseSteps.push(this.shadowRoot.querySelector('#step-2'))
      this.#exerciseSteps.push(this.shadowRoot.querySelector('#step-3'))
      this.#exerciseRepetitions = this.shadowRoot.querySelector('#repetitions')
      this.#exerciseRepetitionMethodType = this.shadowRoot.querySelector('#repetition-method-type')
      this.#exerciseRepetitionMethodNumber = this.shadowRoot.querySelector('#repetition-method-number')
      this.#button = this.shadowRoot.querySelector('#action-button')

      // Add an abort controller to be able to remove event listeners
      this.#abortController = new AbortController()
    }

    /**
     * Called after the element is added to the DOM.
     */
    connectedCallback () {
      if (this.#isExistingExercise) {
        this.#heading.textContent = 'Editing exercise'
        this.#button.textContent = 'Save exercise'
        this.#displayExerciseInformation()
      }

      this.#form.addEventListener('submit', (event) => {
        event.preventDefault()
        if (this.#isExistingExercise) {
          this.#updateExercise()
        } else {
          this.#createExercise()
          this.#form.reset()
        }
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
     * @param {string} programId - The id of the program.
     * @param {string} exerciseId - The id of the exercise.
     */
    setData (programApiUrl, programId, exerciseId) {
      this.#programApiUrl = programApiUrl
      this.#programId = programId
      if (exerciseId !== '') {
        this.#exerciseId = exerciseId
        this.#isExistingExercise = true
      }
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

        return {
          title: data.title,
          startingPosition: data.startingPosition,
          steps: data.steps,
          repetitions: data.repetitions,
          repetitionMethod: data.repetitionMethod
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

      this.#exerciseTitle.value = exercise.title
      this.#exerciseStartingPosition.value = exercise.startingPosition

      const exerciseSteps = exercise.steps.filter(str => str !== '')
      for (let i = 0; i < exerciseSteps.length; i++) {
        this.#exerciseSteps[i].value = exerciseSteps[i]
      }
      this.#exerciseRepetitions.value = exercise.repetitions
      this.#exerciseRepetitionMethodNumber.value = exercise.repetitionMethod.number
      this.#exerciseRepetitionMethodType.value = exercise.repetitionMethod.type
    }

    /**
     * Send the exercise information to the server.
     */
    async #createExercise () {
      try {
        const exerciseApiUrl = this.#programApiUrl + this.#programId + '/exercises'
        const res = await window.fetch(exerciseApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: this.#exerciseTitle.value,
            startingPosition: this.#exerciseStartingPosition.value,
            steps: [this.#exerciseSteps[0].value, this.#exerciseSteps[1].value, this.#exerciseSteps[2].value],
            repetitions: this.#exerciseRepetitions.value,
            repetitionMethod: {
              type: this.#exerciseRepetitionMethodType.value,
              number: this.#exerciseRepetitionMethodNumber.value
            }
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

        this.dispatchEvent(new CustomEvent('exercise-created', {
          bubbles: true,
          detail: {
            programId: this.#programId,
            exerciseId: data.id
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
     * Send the exercise information to the server.
     */
    async #updateExercise () {
      try {
        const exerciseApiUrl = this.#programApiUrl + this.#programId + '/exercises/' + this.#exerciseId
        const res = await window.fetch(exerciseApiUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: this.#exerciseTitle.value,
            startingPosition: this.#exerciseStartingPosition.value,
            steps: [this.#exerciseSteps[0].value, this.#exerciseSteps[1].value, this.#exerciseSteps[2].value],
            repetitions: this.#exerciseRepetitions.value,
            repetitionMethod: {
              type: this.#exerciseRepetitionMethodType.value,
              number: this.#exerciseRepetitionMethodNumber.value
            }
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

        this.dispatchEvent(new CustomEvent('exercise-updated', {
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

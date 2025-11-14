/* eslint-disable jsdoc/require-jsdoc */
/**
 * The desktop component module.
 *
 * @module desktop-component
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

import '../admin-interface/index.js'
import '../auth-login/index.js'
import '../auth-register/index.js'
import '../error-display/index.js'
import '../exercise-editor/index.js'
import '../performance-report/index.js'
import '../program-creator/index.js'
import '../program-display/index.js'
import '../program-editor/index.js'
import '../program-list/index.js'

const template = document.createElement('template')
template.innerHTML = `
<link rel="stylesheet" href="./css/styles.css">
<style>
  :host {
    background-color: var(--background);
    color: var(--foreground);
    margin: 0;
    padding: 0;
  }
  
  .link {
    border: none;
    color: var(--foreground);
    width: auto;
    margin-top: 0;
  }

  .hidden {
    display: none;
  }

  .admin {
    color: red;
  }
</style>
<template id="button-template">
  <li><button type="button" class="link"></button></li>
</template>
<header>
  <nav>
    <ul>
      <li><button type="button" id="home-button" class="link hidden">Home</button></li>
      <li><button type="button" id="performance-button" class="link hidden">Performance</button></li>
      <li><button type="button" id="admin-button" class="link hidden admin">Admin</button></li>
      <li><button type="button" id="logout-button" class="link hidden">Logout</button></li>
    </ul>
  </nav>
</header>
<div class="wrapper" id="wrapper"></div>
`

customElements.define('desktop-component',
  /**
   * Represents a desktop component.
   */
  class extends HTMLElement {
    #abortController
    #accountApiUrl
    #adminButton
    #apiUrl
    #homeButton
    #isValidSession
    #logoutButton
    #performanceButton
    #programApiUrl
    #reportApiUrl
    #wrapper

    /**
     * Creates an instance of the current class.
     */
    constructor () {
      super()
      this.attachShadow({ mode: 'open' })
        .appendChild(template.content.cloneNode(true))

      // Add an abort controller to be able to remove event listeners
      this.#abortController = new AbortController()

      // Get the elements in the shadow root.
      this.#adminButton = this.shadowRoot.querySelector('#admin-button')
      this.#homeButton = this.shadowRoot.querySelector('#home-button')
      this.#logoutButton = this.shadowRoot.querySelector('#logout-button')
      this.#performanceButton = this.shadowRoot.querySelector('#performance-button')
      this.#wrapper = this.shadowRoot.querySelector('#wrapper')

      const pageUrl = new URL(import.meta.url)
      const path = pageUrl.pathname.includes('myphysiotrainer') ? 'myphysiotrainer' : ''
      this.#apiUrl = pageUrl.origin + path + '/api/v1'
      this.#programApiUrl = pageUrl.origin + path + '/api/v1/programs/'
      this.#accountApiUrl = pageUrl.origin + path + '/api/v1/accounts/'
      this.#reportApiUrl = pageUrl.origin + path + '/api/v1/reports/'
    }

    /**
     * Called after the element is added to the DOM.
     */
    connectedCallback () {
      this.#checkSessionStateAndRender()

      this.shadowRoot.addEventListener('register-form-requested', (event) => {
        event.preventDefault()
        this.#removeAllChildren()
        this.#displayRegisterComponent()
      }, {
        signal: this.#abortController.signal
      })

      this.shadowRoot.addEventListener('account-created', (event) => {
        event.preventDefault()
        this.#removeAllChildren()
        this.#displayLoginComponent(event.detail.text)
      }, {
        signal: this.#abortController.signal
      })

      this.shadowRoot.addEventListener('logged-in', (event) => {
        this.#removeAllChildren()
        this.#displayHomeAndLogoutButton()
        if (event.detail.isAdmin === true) {
          this.#displayAdminButton()
        }
        this.#displayProgramList()
      }, {
        signal: this.#abortController.signal
      })

      this.#homeButton.addEventListener('click', (event) => {
        this.#removeAllChildren()
        this.#displayProgramList()
      }, {
        signal: this.#abortController.signal
      })

      this.#performanceButton.addEventListener('click', (event) => {
        this.#removeAllChildren()
        this.#displayPerformanceReport()
      }, {
        signal: this.#abortController.signal
      })

      this.#adminButton.addEventListener('click', (event) => {
        this.#removeAllChildren()
        this.#displayAdminInterface()
      }, {
        signal: this.#abortController.signal
      })

      this.shadowRoot.addEventListener('program-creator-requested', (event) => {
        event.preventDefault()
        this.#removeAllChildren()
        this.#displayProgramCreator()
      }, {
        signal: this.#abortController.signal
      })

      this.shadowRoot.addEventListener('program-created', (event) => {
        event.preventDefault()
        this.#removeAllChildren()
        this.#displayProgramEditor(event.detail)
      }, {
        signal: this.#abortController.signal
      })

      this.shadowRoot.addEventListener('program-display-requested', (event) => {
        event.preventDefault()
        this.#removeAllChildren()
        this.#displayProgramDisplay(event.detail.programId)
      }, {
        signal: this.#abortController.signal
      })

      this.shadowRoot.addEventListener('program-editor-requested', (event) => {
        event.preventDefault()
        this.#removeAllChildren()
        this.#displayProgramEditor(event.detail)
      }, {
        signal: this.#abortController.signal
      })

      this.shadowRoot.addEventListener('program-updated', (event) => {
        this.#removeAllChildren()
        this.#displayProgramList()
      }, {
        signal: this.#abortController.signal
      })

      this.shadowRoot.addEventListener('program-deleted', (event) => {
        this.#removeAllChildren()
        this.#displayProgramList()
      }, {
        signal: this.#abortController.signal
      })

      this.shadowRoot.addEventListener('exercise-editor-requested', (event) => {
        event.preventDefault()
        this.#removeAllChildren()
        this.#displayExerciseEditor(event.detail.programId, event.detail.exerciseId)
      }, {
        signal: this.#abortController.signal
      })

      this.shadowRoot.addEventListener('exercise-created', (event) => {
        event.preventDefault()
        this.#removeAllChildren()
        this.#displayProgramEditor(event.detail.programId)
      }, {
        signal: this.#abortController.signal
      })

      this.shadowRoot.addEventListener('exercise-updated', (event) => {
        event.preventDefault()
        this.#removeAllChildren()
        this.#displayProgramEditor(event.detail.programId)
      }, {
        signal: this.#abortController.signal
      })

      this.#logoutButton.addEventListener('click', (event) => {
        this.#logOutUser()
      })

      this.shadowRoot.addEventListener('error', (event) => {
        this.#removeAllChildren()
        this.#displayErrorDisplay(event.detail)
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
     * Renders the display depending on the session state.
     */
    #renderInitialDisplay () {
      this.#removeAllChildren()
      if (this.#isValidSession === undefined) {
        const p = document.createElement('p')
        p.textContent = 'Loading...'
        this.#wrapper.appendChild(p)
      } else if (this.#isValidSession) {
        this.#displayProgramList()
        this.#displayHomeAndLogoutButton()
      } else {
        this.#displayLoginComponent()
      }
    }

    /**
     * Checks the session state and invokes page rendering.
     */
    async #checkSessionStateAndRender () {
      this.#renderInitialDisplay()
      try {
        const result = await this.#checkValidSession()
        this.#isValidSession = result.validSession
      } catch (error) {
        this.#isValidSession = false
      }

      this.#renderInitialDisplay()
    }

    /**
     * Check if the session is valid.
     *
     * @returns {object} - An object containing session information.
     */
    async #checkValidSession () {
      try {
        const res = await fetch(this.#accountApiUrl + 'check-session', {
          credentials: 'include'
        })

        if (!res.ok) {
          throw new Error('Not logged in')
        }

        return await res.json()
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
     * Display the logout button.
     */
    #displayHomeAndLogoutButton () {
      this.#homeButton.classList.remove('hidden')
      this.#logoutButton.classList.remove('hidden')
      this.#performanceButton.classList.remove('hidden')
    }

    #displayAdminButton () {
      this.#adminButton.classList.remove('hidden')
    }

    /**
     * Log out the user.
     */
    async #logOutUser () {
      try {
        const logoutApiUrl = this.#accountApiUrl + 'logout'
        const res = await window.fetch(logoutApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!res.ok) {
          throw new Error('Logout failed')
        }

        this.#homeButton.classList.add('hidden')
        this.#logoutButton.classList.add('hidden')
        this.#performanceButton.classList.add('hidden')
        window.location.href = '/'

        this.dispatchEvent(new CustomEvent('logged-out', {
          bubbles: true
        }))
      } catch (error) {
        window.location.href = '/'
      }
    }

    /**
     * Display the program list.
     */
    #displayProgramList () {
      const programList = document.createElement('program-list')
      programList.setData(this.#programApiUrl)
      this.#wrapper.appendChild(programList)
    }

    /**
     * Display the program creator.
     */
    #displayProgramCreator () {
      const programCreator = document.createElement('program-creator')
      programCreator.setData(this.#programApiUrl)
      this.#wrapper.appendChild(programCreator)
    }

    /**
     * Display the program display.
     *
     * @param {string} programId - An id of the program.
     */
    #displayProgramDisplay (programId) {
      const programDisplay = document.createElement('program-display')
      programDisplay.setData(this.#programApiUrl, programId, this.#reportApiUrl)
      this.#wrapper.appendChild(programDisplay)
    }

    /**
     * Display the program editor.
     *
     * @param {string} programId - The id of the training program.
     */
    #displayProgramEditor (programId) {
      const programEditor = document.createElement('program-editor')
      programEditor.setData(this.#programApiUrl, programId)
      this.#wrapper.appendChild(programEditor)
    }

    /**
     * Display the exercise editor.
     *
     * @param {string} programId - The id of the training program the exercise should be added to.
     * @param {string} exerciseId - The id of the exercise.
     */
    #displayExerciseEditor (programId, exerciseId) {
      const exerciseEditor = document.createElement('exercise-editor')
      exerciseEditor.setData(this.#programApiUrl, programId, exerciseId)
      this.#wrapper.appendChild(exerciseEditor)
    }

    /**
     * Display the login component.
     *
     * @param {string} textToDisplay - The information text to display.
     */
    #displayLoginComponent (textToDisplay) {
      const loginComponent = document.createElement('auth-login')
      loginComponent.setData(this.#accountApiUrl, textToDisplay)
      this.#wrapper.appendChild(loginComponent)
    }

    /**
     * Display the register component.
     */
    #displayRegisterComponent () {
      const registerComponent = document.createElement('auth-register')
      registerComponent.setData(this.#accountApiUrl)
      this.#wrapper.appendChild(registerComponent)
    }

    /**
     * Display the performance report.
     */
    #displayPerformanceReport () {
      const registerComponent = document.createElement('performance-report')
      registerComponent.setData(this.#apiUrl)
      this.#wrapper.appendChild(registerComponent)
    }

    #displayAdminInterface () {
      const registerComponent = document.createElement('admin-interface')
      registerComponent.setData(this.#accountApiUrl)
      this.#wrapper.appendChild(registerComponent)
    }

    /**
     * Display the error.
     *
     * @param {object} error - The error object.
     */
    #displayErrorDisplay (error) {
      const errorComponent = document.createElement('error-display')
      errorComponent.setData(error)
      this.#wrapper.appendChild(errorComponent)
    }

    /**
     * Helper method to remove all children from DOM.
     */
    #removeAllChildren () {
      while (this.#wrapper.firstChild) {
        this.#wrapper.removeChild(this.#wrapper.firstChild)
      }
    }
  }
)

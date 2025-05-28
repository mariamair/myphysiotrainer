/**
 * The error display module.
 *
 * @module error-display
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

const template = document.createElement('template')
template.innerHTML = `
<link rel="stylesheet" href="./css/styles.css">
<style>
  .wrapper {
    text-align: center;
    position: absolute;
    top: 35%;
  }

  h1 {
    color: var(--error);
  }

  p {
    margin-top: 10px;
    padding: 20px;
  }
</style>
<template id="error-template">
  <h1 id="error-status"></h1>
  <p id="error-message"></p>
</template>
<div class="wrapper" id="wrapper">
  <h1 id="test"></h1>
</div>
`

customElements.define('error-display',
  /**
   * Represents a error display element.
   */
  class extends HTMLElement {
    #abortController
    #error
    #errorTemplate

    /**
     * Creates an instance of the current type.
     */
    constructor () {
      super()
      this.attachShadow({ mode: 'open' })
        .appendChild(template.content.cloneNode(true))

      // Get the elements in the shadow root.
      this.#errorTemplate = this.shadowRoot.querySelector('#error-template')

      // Add an abort controller to be able to remove event listeners
      this.#abortController = new AbortController()
    }

    /**
     * Called after the element is added to the DOM.
     */
    connectedCallback () {
      this.#displayErrorInformation()
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
     * @param {object} error - The error object.
     */
    setData (error) {
      this.#error = error
    }

    /**
     * Display error information.
     */
    async #displayErrorInformation () {
      const errorItem = this.#errorTemplate.content.cloneNode(true)
      errorItem.firstElementChild.textContent = this.#error.statusCode + ' ' + this.#error.statusMessage
      errorItem.querySelector('#error-message').textContent = this.#error.message
      this.shadowRoot.querySelector('#wrapper').appendChild(errorItem)
    }
  }
)

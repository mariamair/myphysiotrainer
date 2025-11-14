/* eslint-disable jsdoc/require-jsdoc */
/**
 * The admin interface module.
 *
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

  p {
    margin-top: 10px;
    background-color: var(--module-var1);
    padding: 20px;
  }

  .list {
    margin-top: 30px;
  }

  .list-item {
    background-color: #f7f6bc;
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
  <div id="inner-wrapper">
    <div id="user-account-list" class="list">
      <h2>User accounts</h2>
    </div>
    <div id="action-buttons">
      <button type="button" id="edit-button" class="editing-button">Edit</button>
      <button type="button" id="delete-button" class="editing-button">Delete</button>
    </div>
  </div>
</div>
`

customElements.define('admin-interface',
  /**
   * Represents a program display element.
   */
  class extends HTMLElement {
    #abortController
    #accountApiUrl
    #accountList
    #innerWrapper
    #listItemTemplate
    // #programId

    /**
     * Creates an instance of the current type.
     */
    constructor () {
      super()
      this.attachShadow({ mode: 'open' })
        .appendChild(template.content.cloneNode(true))

      // Get the elements in the shadow root.
      this.#innerWrapper = this.shadowRoot.querySelector('#inner-wrapper')
      this.#accountList = this.shadowRoot.querySelector('#user-account-list')
      this.#listItemTemplate = this.shadowRoot.querySelector('#list-item-template')

      // Add an abort controller to be able to remove event listeners
      this.#abortController = new AbortController()
    }

    /**
     * Called after the element is added to the DOM.
     */
    connectedCallback () {
      this.#addUserAccountsToList()
    }

    /**
     * Called after the element is removed from the DOM.
     */
    disconnectedCallback () {
      this.#abortController.abort()
    }

    setData (accountApiUrl) {
      this.#accountApiUrl = accountApiUrl
    }

    /**
     * Add all user accounts to the list.
     */
    async #addUserAccountsToList () {
      const users = await this.#getUserAccounts()

      for (const user of users) {
        const listItem = this.#listItemTemplate.content.cloneNode(true)
        listItem.firstElementChild.setAttribute('data-user-id', user.id)
        listItem.firstElementChild.textContent = user.username
        this.#accountList.appendChild(listItem)
      }
    }

    /**
     * Fetch users from the database.
     *
     * @returns {Promise<object[]>} - An array of exercise objects.
     */
    async #getUserAccounts () {
      try {
        const res = await window.fetch(this.#accountApiUrl, {
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
     * Helper method to remove all children from DOM.
     */
    #removeAllChildren () {
      while (this.#innerWrapper.firstChild) {
        this.#innerWrapper.removeChild(this.#innerWrapper.firstChild)
      }
    }
  }
)

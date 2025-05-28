/**
 * The performance report module.
 *
 * @module performance-report
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

const template = document.createElement('template')
template.innerHTML = `
<link rel="stylesheet" href="./css/styles.css">
<style>
  canvas {
    width = 400px;
    height = 200px;
    border: 1px solid #ccc;
  }
</style>
<template id="chart-template">
  <h2 id="program-title"></h2>
  <canvas></canvas>
</template>
<div class="wrapper">
  <h1 id="title">Performance</h1>
  <div id="charts"></div>
</div>
`

customElements.define('performance-report',
  /**
   * Represents a performance report element.
   */
  class extends HTMLElement {
    #abortController
    #charts
    #chartTemplate
    #reportApiUrl

    /**
     * Creates an instance of the current type.
     */
    constructor () {
      super()
      this.attachShadow({ mode: 'open' })
        .appendChild(template.content.cloneNode(true))

      // Get the elements in the shadow root.
      this.#charts = this.shadowRoot.querySelector('#charts')
      this.#chartTemplate = this.shadowRoot.querySelector('#chart-template')
      // Add an abort controller to be able to remove event listeners
      this.#abortController = new AbortController()
    }

    /**
     * Called after the element is added to the DOM.
     */
    connectedCallback () {
      this.#getRepetitionsPerProgram()
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
     * @param {string} apiUrl - The API url.
     */
    setData (apiUrl) {
      this.#reportApiUrl = apiUrl + '/reports/'
    }

    /**
     * Fetch reports from the database.
     *
     * @returns {Promise<object[]>} - An array of report objects.
     */
    async #getAllReports () {
      try {
        const res = await fetch(this.#reportApiUrl, {
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
     * Fetch reports from the database.
     *
     * @returns {object[]} - An array of report objects.
     */
    async #getRepetitionsPerProgram () {
      try {
        const reports = await this.#getAllReports()

        if (!reports) {
          const error = new Error('Unknown error')
          error.statusCode = 500
          error.statusMessage = 'Unknown error'
          error.message = 'An unexpected condition was encountered.'
          throw error
        }
        const programIds = [...new Set(reports.map(report => report.programId))].sort()

        const reportData = {}

        const reportsForPrograms = this.#sortReportsByProgramId(programIds, reports)

        // Get repetitions per exercise for each program.
        let index = 1
        for (const reportsForProgram of reportsForPrograms) {
          const exercises = [...new Map(reportsForProgram.map(({ exerciseId, exerciseTitle }) => [exerciseId, { exerciseId, exerciseTitle }])).values()]

          // Use the program title of the latest report.
          reportData.programTitle = reportsForProgram[reportsForProgram.length - 1].programTitle

          reportData.exerciseTitles = exercises.map(exercise => exercise.exerciseTitle)
          reportData.repetitions = this.#calculateRepetitions(exercises.map(exercise => exercise.exerciseId), reportsForProgram)
          reportData.index = index
          this.#drawChart(reportData)
          index++
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
     * Create an array with an object for each program, containing the program's reports.
     *
     * @param {string[]} programIds - The id's of the programs.
     * @param {object[]} reports - An array containing all report objects.
     * @returns {object[]} - An array containing the sorted report objects.
     */
    #sortReportsByProgramId (programIds, reports) {
      const reportsForPrograms = []
      for (const id of programIds) {
        const reportsForProgram = reports.filter(report => report.programId === id)
        reportsForPrograms.push(reportsForProgram)
      }
      return reportsForPrograms
    }

    /**
     * Calculate repetitions for each exercise.
     *
     * @param {string[]} exerciseIds - The id's of the exercises.
     * @param {object[]} reportsForProgram - All reports for the program.
     * @returns {number[]} - An array of repetition numbers.
     */
    #calculateRepetitions (exerciseIds, reportsForProgram) {
      const repetitionArray = []
      for (const id of exerciseIds) {
        let repetitions = 0
        const reportsForExercise = reportsForProgram.filter(report => report.exerciseId === id)
        for (const report of reportsForExercise) {
          repetitions += report.executedRepetitions
        }
        repetitionArray.push(repetitions)
      }
      return repetitionArray
    }

    /**
     * Display the report data as charts.
     *
     * @param {object} reportData - The data to display.
     */
    #drawChart (reportData) {
      const chart = this.#chartTemplate.content.cloneNode(true)
      chart.firstElementChild.textContent = reportData.programTitle
      chart.querySelector('canvas').setAttribute('id', `chart-${reportData.index}`)
      this.#charts.appendChild(chart)

      const ctx = this.shadowRoot.querySelector(`#chart-${reportData.index}`).getContext('2d')
      // eslint-disable-next-line no-new, no-undef
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: reportData.exerciseTitles,
          datasets: [{
            label: 'Repetitions',
            data: reportData.repetitions,
            backgroundColor: '#D5FEFF',
            color: '#000'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: '#E0E5E8', // Legend font color
                font: {
                  size: 14
                }
              }
            },
            tooltip: { enabled: false }
          },
          scales: {
            x: { // x-axis label color and font size
              ticks: {
                color: '#E0E5E8',
                font: {
                  size: 16
                }
              }
            },
            y: { // y-axis label color and font size
              ticks: {
                color: '#E0E5E8',
                font: {
                  size: 16
                },
                /**
                 * Only display integers on y-axis.
                 *
                 * @param {number} value - The value to check.
                 * @returns {*} - An integer value.
                 */
                callback: function (value) {
                  if (Number.isInteger(value)) {
                    return value
                  }
                }
              }
            }
          }
        }
      })
    }
  }
)

/**
 * @file Defines the HomeController class.
 * @module HomeController
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

/**
 * Encapsulates a controller.
 */
export class HomeController {
  /**
   * Renders a view and sends the rendered HTML string as an HTTP response.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  showLandingPage (req, res, next) {
    res.render('home/index')
  }
}

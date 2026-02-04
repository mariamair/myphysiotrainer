/* eslint-disable no-unused-vars */
/**
 * Defines the HomeController class that displays the landing page.
 * 
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

export class HomeController {
  showLandingPage (req, res, next) {
    res.render('home/index')
  }
}

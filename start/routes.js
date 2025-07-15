'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

Route.on('/').render('welcome')
Route.on('/home').render("home")
Route.on('/login').render("login")
Route.on('/signup').render("signup")
Route.on('/player').render("player")
Route.on('/organisator').render("organisator")
Route.on('/account').render("account")
Route.on('/account/modify').render("modify")
Route.on('/signup/success').render("send_mel")
Route.on('/recompenses').render("recompenses")
Route.on('/chasse/create').render("create_chasse")
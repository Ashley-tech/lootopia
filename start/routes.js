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

const Env = use('Env') // ✅ correct en AdonisJS 4.1


/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

Route.on('/').render('welcome')
Route.on('/home').render("home")
Route.on('/login').render("login")
Route.on('/signup').render("signup")
Route.on('/player').render("player")
Route.on('/organisator').render("organisator")
Route.on('/account').render("account")
Route.on('/login/forgot').render("forgot")
Route.get("/pwd", async ({request,view}) => {
  const mel = request.input("mel")
  return view.render("reinit_pwd", {
    mel
  })
})
Route.on('/account/modify').render("modify")
Route.get("/signup/success", async ({request,view}) => {
  const mel = request.input("login")
  const mdp = request.input("mdp")
  return view.render("send_mel", {
    mel,mdp
  })
})
Route.on('/recompenses').render("recompenses")
Route.on('/chasse/create').render("create_chasse")
Route.on('/marketplace').render("marketplace")
Route.on('/marketplace/articles').render("articles")
Route.on('/shop').render("boutique")
Route.get('/player/:chasse', async ({ params,view }) => {
  const id = params.chasse

  // Tu peux passer les valeurs à ta vue :
  return view.render('play_chasse', {
    id,
    googleMapsApiKey: Env.get('MAP_API_KEY'),
  })
})

public async showSignup({ view, session, request, response, auth }) {
    const username = session.get('username') || null;
    return view.render('signup', { username });
  }
  
  public async showSignup0({ view, session, request, response, auth }) {
    const username = session.get('username') || null;
    return view.render('welcome', { username });
  }
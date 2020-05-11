const lodash = require('lodash');
const uuidv4 = require('uuid');

const express = require('express');

const app = express();
app.use(express.json());

// Your code starts here.
// Placeholders for all requests are provided for your convenience.
const users = {};

const articles = [];

let tokenList = [];

app.post('/api/user', (req, res) => {
  if (!lodash.isEmpty(req.body)) {
    if (!users[req.body.login]) {
      users[req.body.login] = {
        password: req.body.password,
        user_id: req.body.user_id,
      };
      res.sendStatus(201);
    }
  } else {
    res.sendStatus(400);
  }
});

app.post('/api/authenticate', (req, res) => {
  if (!lodash.isEmpty(req.body)) {
    if (!users[req.body.login]) {
      res.sendStatus(404);
    } else if (users[req.body.login].password !== req.body.password) {
      res.sendStatus(401);
    } else if (users[req.body.login].password === req.body.password) {
      const { user_id } = users[req.body.login];
      const token = uuidv4.v4();
      tokenList.push({ user_id, token });
      res.json({ token });
    }
  } else {
    res.sendStatus(400);
  }
});

app.post('/api/logout', (req, res) => {
  if (!lodash.isEmpty(req.body)) {
    const token = req.headers['authentication-header'];
    tokenList = tokenList.filter((t) => t.token !== token);
    res.sendStatus(200);
  } else {
    res.sendStatus(400);
  }
});

app.post('/api/articles', (req, res) => {
  if (!lodash.isEmpty(req.body)) {
    const token = req.headers['authentication-header'];
    const user = tokenList.find((t) => t.token === token);
    if (user) {
      const article = { ...req.body, user_id: user.user_id };
      articles.push(article);
      res.sendStatus(201);
    } else {
      res.sendStatus(401);
    }
  } else {
    res.sendStatus(400);
  }
});

app.get('/api/articles', (req, res) => {
  const token = req.headers['authentication-header'];
  const user = tokenList.find((t) => t.token === token);
  if (user) {
    const returnedArticles = articles.filter((article) => {
      if (article.visibility === 'public' || article.visibility === 'logged_in') {
        return true;
      }
      if (article.visibility === 'private' && article.user_id === user.user_id) {
        return true;
      }
      return false;
    });
    res.json(returnedArticles);
  } else {
    res.send(articles.filter((article) => article.visibility === 'public'));
  }
});

exports.default = app.listen(process.env.HTTP_PORT || 3000);

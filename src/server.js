import { Mentor } from "./mentor";
import { camelize, log } from "./utils";

var R        = require("ramda");
var http     = require("http");
var BPromise = require("bluebird");

class Server {
  constructor(port, options) {
    var mentor = new Mentor(options);

    http.createServer(function (req, res) {
      mentor.github_webhook.handler(req, res, function () {
        res.statusCode = 404;
        res.end('no such location');
      });
    }).listen(port || 5000);

    mentor.github_webhook.handler.on('error', function (err) {
      console.error('Error:', err.message);
    });


    mentor.github_webhook.handler.on('issues', function (event) {
      log('Received an issue event for "%s" action=%s: "#%d %s"',
        event.payload.repository.name,
        event.payload.action,
        event.payload.issue.number,
        event.payload.issue.title);

      var fn = camelize(`${event.event}_${event.payload.action}`);
      if (!(mentor.hasOwnProperty(fn) && R.is(Function, mentor[fn]))) {
        console.error(`'${fn}' is not implemented!`);
        return;
      }
      var [action, data] = mentor[fn](event.payload);
      if (!R.isNil(action)) {
        mentor.pivotal[action](data);
      }
    });

    mentor.github_webhook.handler.on('pull_request', function (event) {
      log('Received an pull_request event for "%s" action=%s: "#%d %s"',
        event.payload.repository.full_name,
        event.payload.action,
        event.payload.pull_request.number,
        event.payload.pull_request.title);

      var fn = camelize(`${event.event}_${event.payload.action}`);
      if (!(mentor.hasOwnProperty(fn) && R.is(Function, mentor[fn]))) {
        console.error(`'${fn}' is not implemented!`);
        return;
      }
      var [action, data] = mentor[fn](event.payload);
      if (!R.isNil(action)) {
        mentor.pivotal[action](data);
      }
    });

    // issue or pull request comment
    mentor.github_webhook.handler.on('issue_comment', function (event) {
      var payload = event.payload;
      var issue   = payload.issue;
      var kind    = (issue.pull_request) ? "pull" : "issue";
      log('Received an issue_comment event for "%s" action=%s: "#%d %s"',
        payload.repository.full_name,
        payload.action,
        issue.number,
        issue.title);
      log('    %s', payload.issue.html_url);

      var fn    = camelize(`${event.event}_${payload.action}`);
      if (!(mentor.hasOwnProperty(fn) && R.is(Function, mentor[fn]))) {
        console.error(`'${fn}' is not implemented!`);
        return;
      }

      return BPromise.coroutine(function* () {
        var external_id = `${payload.repository.full_name}/${kind}/${issue.number}`;
        var story       = yield mentor.pivotal.searchByExternalId(external_id);

        if (!R.isNil(story)) {
          var [action, data] = mentor[fn](story.id, payload);
          if (!R.isNil(action)) {
            mentor.pivotal[action](data, story);
          }
        }
      })();
    }.bind(this));
  }
}

module.exports = Server;

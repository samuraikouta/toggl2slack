// 日付定義
var today = new Date();
var seven_days_ago =  new Date();
seven_days_ago.setDate(seven_days_ago.getDate() - 7);
var yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

// token
var member1 = '<togglのapi>:api_token';
var member2 = '<togglのapi>:api_token';
var member3 = '<togglのapi>:api_token';
var member4 = '<togglのapi>:api_token';
var member5 = '<togglのapi>:api_token';

var tokens = [member1, member2, member3, member4, member5];

var Toggl = {
  get: function (path, token) {
    var url = 'https://www.toggl.com/api/v8' + path;
    var options = {
      'method': 'GET',
      'headers': {"Authorization": "Basic " + Utilities.base64Encode(token)}
    }
    var response = UrlFetchApp.fetch(url, options);
    return JSON.parse(response);
  },
  getTimeEntries: function (token, startDate, endDate) {
    var path = '/time_entries?start_date=' + formatDate(startDate) + 'T00%3A00%3A00%2B09%3A00&end_date=' + formatDate(endDate) + 'T23%3A59%3A59%2B09%3A00';
    return this.get(path, token)
  },
  getTimeEntry: function (id, token) {
    var path = '/time_entries/' + id;
    return this.get(path, token);
  },
  getProject: function (id, token) {
    var path = '/projects/' + id;
    return this.get(path, token);
  },
  getUser: function (token) {
    var path = '/me';
    return this.get(path, token);
  }
};

var Slack = {
  post: function (message) {
    var url = '<slack webhookのurl>';
    var options = {
      'method': 'POST',
      'contentType': 'application/json',
      'payload': JSON.stringify({'text': message})
    };
    var response = UrlFetchApp.fetch(url, options);
    return response;
  }
};

// weekly実効
function weeklyNotification() {
  notification2Slack(seven_days_ago, yesterday)
}

// daily実効
function dailyNotification() {
  notification2Slack(yesterday, yesterday)
}

// スラック通知
function notification2Slack(startDate, endDate) {
  slackPost = '【通知】' + formatDate(startDate) + ' 〜 ' + formatDate(endDate) + ' コミット時間\n';
  // 全員分回す
  for (var i in tokens) {
    var token = tokens[i];

    // toggl取得
    var timeEntries = Toggl.getTimeEntries(token, startDate, endDate);

    // togglで取得したものを回す
    totalTime = 0;
    for (var i in timeEntries) {
      // 1週間の合計時間を計算
      var timeEntry = timeEntries[i];
      totalTime += timeEntry.duration;
    }
    var fullname = Toggl.getUser(token).data.fullname;
    var time = formatTime(totalTime);

    // スラック通知用テキスト
    slackPost += formatSummaryText(fullname, startDate, endDate, time) + '\n';
  }
  // スラック通知
  Slack.post(slackPost);
}

// スラック通知用テキストフォーマット
function formatSummaryText(fullname, startDate, endDate, time) {
  return fullname + ': ' + time
}

// 時間変換用フォーマット
function formatTime(duration) {
  var h, m, s;

  h = duration / 3600 | 0;
  duration %= 3600;

  m = duration / 60 | 0;
  duration %= 60;

  return h + '時間' + m + '分';
}

// 日時変換用フォーマット
function formatDate(date) {
  var y = date.getFullYear();
  var m = ("00" + (date.getMonth()+1)).slice(-2);
  var d = ("00" + date.getDate()).slice(-2);
  var result = y + "-" + m + "-" + d;
  return result;
}

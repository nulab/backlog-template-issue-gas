import HTTPResponse = GoogleAppsScript.URL_Fetch.HTTPResponse
import URLFetchRequestOptions = GoogleAppsScript.URL_Fetch.URLFetchRequestOptions
import {Http, HttpClient} from "../Http"
import {BacklogClient, BacklogClientImpl, issueToObject} from "../BacklogClient"
import {Either, Right, Left} from "../Either"
import {Issue, IssueType, Priority, User, Category} from "../datas"
import {None, Some} from "../Option"

describe("BacklogClient", function () {

  class FakeHttp implements Http {
    public get(uri: string): JSON {
      if (uri === "https://testspace.backlog.jp/api/v2/projects/SPR?apiKey=testapikeystring") {
        return this.toJson(this.getProject())
      }
      if (uri === "https://testspace.backlog.jp/api/v2/projects/12345/users?apiKey=testapikeystring") {
        return this.toJson(this.getUsers())
      }
      if (uri === "https://testspace.backlog.jp/api/v2/projects/12345/issueTypes?apiKey=testapikeystring") {
        return this.toJson(this.getIssueTypes())
      }
      if (uri === "https://testspace.backlog.jp/api/v2/projects/12345/categories?apiKey=testapikeystring") {
        return this.toJson(this.getCategories())
      }
      if (uri === "https://testspace.backlog.jp/api/v2/projects/12345/versions?apiKey=testapikeystring") {
        return this.toJson(this.getVersions())
      }
      if (uri === "https://testspace.backlog.jp/api/v2/issues/1234567890?apiKey=testapikeystring") {
        return this.toJson(this.getIssue())
      }
      return this.toJson("{}")
    }
    public post(uri: string, data: any): JSON {
      return this.toJson("{}")
    }
    private toJson(text): JSON {
      return JSON.parse(text)
    }

    private getProject(): string {
      return `{
          "id": 12345,
          "projectKey": "SPR",
          "name": "SPR",
          "chartEnabled": true,
          "subtaskingEnabled": true,
          "projectLeaderCanEditProjectLeader": false,
          "useWikiTreeView": true,
          "textFormattingRule": "backlog",
          "archived": false,
          "displayOrder": 2147483646
        }`
    }

    private getUsers(): string {
      return `[
        {
          "id": 111222,
          "userId": "shomatan",
          "name": "shomatan",
          "roleType": 1,
          "lang": "en",
          "mailAddress": "shoma.nishitateno@gas-test.com",
          "nulabAccount": null
        },
        {
          "id": 777666,
          "userId": "USER2",
          "name": "USER2",
          "roleType": 2,
          "lang": null,
          "mailAddress": "user2@gas-test.com",
          "nulabAccount": null
        }]`
    }

    private getIssueTypes(): string {
      return `[
        {
          "id": 12200,
          "projectId": 12345,
          "name": "Task",
          "color": "#7ea800",
          "displayOrder": 0
        },
        {
          "id": 12201,
          "projectId": 12345,
          "name": "Bug",
          "color": "#990000",
          "displayOrder": 1
        },
        {
          "id": 12202,
          "projectId": 12345,
          "name": "Request",
          "color": "#ff9200",
          "displayOrder": 2
        }]`
    }

    private getCategories(): string {
      return `[
        {
          "id": 88765,
          "name": "CatA",
          "displayOrder": 2147483646
        }]`
    }

    private getVersions(): string {
      return `[
        {
          "id": 121212,
          "projectId": 12345,
          "name": "1.0.0",
          "description": null,
          "startDate": null,
          "releaseDueDate": null,
          "archived": false,
          "displayOrder": 0
        },
        {
          "id": 121213,
          "projectId": 12345,
          "name": "0.9.0",
          "description": null,
          "startDate": null,
          "releaseDueDate": null,
          "archived": false,
          "displayOrder": 1
        }]`
    }

    private getIssue(): string {
      return `{
          "id": 1234567890,
          "projectId": 12345,
          "issueKey": "SPR-777",
          "keyId": 777,
          "issueType": {
            "id": 400999,
            "projectId": 12345,
            "name": "Task",
            "color": "#7ea800",
            "displayOrder": 0
          },
          "summary": "This is a test issue",
          "description": "- [ ] aa - [ ] bb",
          "resolution": null,
          "priority": {
            "id": 3,
            "name": "Normal"
          },
          "status": {
            "id": 1,
            "name": "Open"
          },
          "assignee": {
            "id": 123321,
            "userId": "shomatan",
            "name": "shomatan",
            "roleType": 1,
            "lang": "en",
            "mailAddress": "shoma.nishitateno@gas-test.com",
            "nulabAccount": null
          },
          "category": [],
          "versions": [],
          "milestone": [],
          "startDate": null,
          "dueDate": "2018-05-10T00:00:00Z",
          "estimatedHours": null,
          "actualHours": null,
          "parentIssueId": 7777777,
          "createdUser": {
            "id": 123321,
            "userId": "shomatan",
            "name": "shomatan",
            "roleType": 1,
            "lang": "en",
            "mailAddress": "shoma.nishitateno@gas-test.com",
            "nulabAccount": null
          },
          "created": "2018-05-10T23:38:48Z",
          "updatedUser": {
            "id": 123321,
            "userId": "shomatan",
            "name": "shomatan",
            "roleType": 1,
            "lang": "en",
            "mailAddress": "shoma.nishitateno@gas-test.com",
            "nulabAccount": null
          },
          "updated": "2018-05-10T23:38:48Z",
          "customFields": [],
          "attachments": [],
          "sharedFiles": [],
          "stars": []
        }`
    }
  }

  const client = new BacklogClientImpl(new FakeHttp(), "testspace", ".jp", "testapikeystring")

  test("Get project", function () {
    const result = client.getProjectV2("SPR")
    expect(result.isRight).toBe(true)
    result.map(project => {
      expect(project.projectKey).toBe("SPR")
      expect(project.id).toBe(12345)
    })
  })

  test("Get users", function () {
    const users = client.getUsersV2(12345)
    expect(users.length).toBe(2)
    expect(users[0].name).toBe("shomatan")
    expect(users[1].id).toBe(777666)
    expect(users[1].name).toBe("USER2")
  })

  test("Get issue types", function () {
    const issueTypes = client.getIssueTypesV2(12345)
    expect(issueTypes.length).toBe(3)
    expect(issueTypes[0].name).toBe("Task")
    expect(issueTypes[1].name).toBe("Bug")
    expect(issueTypes[2].name).toBe("Request")
  })

  test("Get categories", function () {
    const categories = client.getCategoriesV2(12345)
    expect(categories.length).toBe(1)
    expect(categories[0].id).toBe(88765)
    expect(categories[0].name).toBe("CatA")
  })

  test("Get versions", function () {
    const versions = client.getVersionsV2(12345)
    expect(versions.length).toBe(2)
    expect(versions[0].id).toBe(121212)
    expect(versions[0].name).toBe("1.0.0")
    expect(versions[1].id).toBe(121213)
    expect(versions[1].name).toBe("0.9.0")
  })

  test("Get an issue", function () {
    const maybeIssue = client.getIssueV2(1234567890)
    expect(maybeIssue.isDefined).toBe(true)
    maybeIssue.map(issue => {
      expect(issue.id).toBe(1234567890)
      expect(issue.summary).toBe("This is a test issue")
      issue.description.map(description => expect(description).toBe("- [ ] aa - [ ] bb"))
      expect(issue.startDate.isDefined).toBe(false)
      expect(issue.dueDate.isDefined).toBe(true)
      expect(issue.estimatedHours.isDefined).toBe(false)
      expect(issue.actualHours.isDefined).toBe(false)
      expect(issue.issueType.name).toBe("Task")
      expect(issue.categories.length).toBe(0)
      expect(issue.versions.length).toBe(0)
      expect(issue.milestones.length).toBe(0)
      expect(issue.priority.name).toBe("Normal")
      expect(issue.assignee.isDefined).toBe(true)
      expect(issue.parentIssueId.isDefined).toBe(true)
      issue.parentIssueId.map(parentIssueId => expect(parentIssueId).toBe(7777777))
    })
  })
})

describe("BacklogClient", function () {

  test("issue to object", function () {
    const issue = Issue(
      0,
      "",
      123,
      "test summary",
      Some("description"),
      Some(new Date("2018-04-16T15:00:00.000Z")), // startDate
      Some(new Date("2018-01-01T02:00:00.000Z")), // dueDate
      Some(1.25), // estimatedHours
      Some(3.3), // actualHours
      IssueType(1, "issue type"),
      [Category(1, "cat1"), Category(2, "cat2")], // category
      [], // version
      [], // milestone
      Priority(2, "priority"),
      Some(User(3, "user")),
      Some("*")
    )
    const actual = issueToObject(issue)
    expect(actual.projectId).toBe(123)
    expect(actual.summary).toBe("test summary")
    expect(actual.description).toBe("description")
    expect(actual.startDate).toEqual("2018-04-16")
    expect(actual.dueDate).toEqual("2018-01-01")
    expect(actual.estimatedHours).toEqual(1.25)
    expect(actual.actualHours).toEqual(3.3)
    expect(actual.issueTypeId).toEqual(1)
    expect(actual.categories)

  })
})

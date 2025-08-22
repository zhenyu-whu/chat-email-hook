该项目为 Cloudflare 的 worker，作为 postmark 邮件服务的 Inbound stream 的 webhook，将其 POST 的数据存储在 D1 数据库中。

GET 访问该 worker 时，展示数据库中的前 10 条数据。
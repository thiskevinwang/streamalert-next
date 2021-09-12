# Historical Search

StreamAlert historical search feature is backed by Amazon S3 and
[Athena](https://aws.amazon.com/athena/) services. By default,
StreamAlert will send all alerts to S3 and those alerts will be
searchable in Athena table. StreamAlert users have option to enable
historical search feature for data as well.

As of StreamAlert v3.1.0, a new field, `file_format`, has been added to
`athena_partitioner_config` in `conf/lamba.json`, defaulting to `null`.
This field allows users to configure how the data processed by the
Classifier is stored in S3 bucket, either in `parquet` or `json`.

Prior to v3.1.0, all data was stored in `json`. When using this format,
Athena\'s search performance degrades greatly when partition sizes grow.
To address this, we\'ve introduce support for `parquet` to provide
better Athena search performance and cost saving.

::: note
::: title
Note
:::

-   When upgrading to StreamAlert v3.1.0, you must set the `file_format`
    value to either `parquet` or `json`, otherwise StreamAlert will
    raise `MisconfigurationError` exception when running
    `python manage.py build`.
-   For existing deployments, the `file_format` value can be set to
    `json` to retain current functionality. However, if the
    `file_format` is changed to `parquet`, new Athena tables will need
    to be recreated to load the `parquet` format. The existing JSON data
    won\'t be searchable anymore unless we build a separated tables to
    process data in JSON format. All of the underlying data remains
    stored in S3 bucket, there is no data loss.
-   For new StreamAlert deployments, it is recommended to set
    `file_format` to `parquet` to take advantage of better Athena search
    performance and cost savings when scanning data.
-   In an upcoming release, the value for `file_format` will be set to
    `parquet` by default, so let\'s change now!
:::

## Architecture

![image](../images/historical-search.png){.align-left}

The pipeline is:

> 1.  StreamAlert creates an Athena Database, alerts kinesis Firehose
>     and `alerts` table during initial deployment
> 2.  Optionally create Firehose resources and Athena tables for
>     historical data retention
> 3.  S3 events will be sent to an SQS that is mapped to the Athena
>     Partitioner Lambda function
> 4.  The Lambda function adds new partitions when there are new alerts
>     or data saved in S3 bucket via Firehose
> 5.  Alerts, and optionally data, are available for searching via
>     Athena console or the Athena API

## Alerts Search {#alerts_search}

-   Review the settings for the
    `Alerts Firehose Configuration <alerts_firehose_configuration>`{.interpreted-text
    role="ref"} and the
    `Athena Partitioner<configure_athena_partitioner_lambda>`{.interpreted-text
    role="ref"} function. Note that the Athena database and alerts table
    are created automatically when you first deploy StreamAlert.

-   If the `file_format` value within the
    `Athena Partitioner<configure_athena_partitioner_lambda>`{.interpreted-text
    role="ref"} function config is set to `parquet`, you can run the
    `MSCK REPAIR TABLE alerts` command in Athena to load all available
    partitions and then alerts can be searchable. Note, however, that
    the `MSCK REPAIR` command cannot load new partitions automatically.

-   StreamAlert includes a Lambda function to automatically add new
    partitions for Athena tables when the data arrives in S3. See
    `configure_athena_partitioner_lambda`{.interpreted-text role="ref"}

    ``` bash
    {
      "athena_partitioner_config": {
        "concurrency_limit": 10,
        "file_format": "parquet",
        "log_level": "info"
      }
    }
    ```

-   Deploy the Athena Partitioner Lambda function

    ``` bash
    python manage.py deploy --functions athena
    ```

-   Search alerts in [Athena
    Console](https://console.aws.amazon.com/athena)

    -   Choose your `Database` from the dropdown on the left. Database
        name is `<prefix>_streamalert`
    -   Write SQL query statement in the `Query Editor` on the right

    ![image](../images/athena-alerts-search.png)

## Data Search

It is optional to store data in S3 bucket and available for search in
Athena tables.

-   Enable Firehose in `conf/global.json` see
    `firehose_configuration`{.interpreted-text role="ref"}

-   Build the Firehose and Athena tables

    ``` bash
    python manage.py build
    ```

-   Deploy classifier so classifier will know to send data to S3 bucket
    via Firehose

    ``` bash
    python manage.py deploy --functions classifier
    ```

-   Search data [Athena Console](https://console.aws.amazon.com/athena)

    -   Choose your `Database` from the dropdown on the left. Database
        name is `<prefix>_streamalert`
    -   Write SQL query statement in the `Query Editor` on the right

    ![image](../images/athena-data-search.png)

## Configure Lambda Settings {#configure_athena_partitioner_lambda}

Open `conf/lambda.json`, and fill in the following options:

  Key                       Required   Default   Description
  ------------------------- ---------- --------- ------------------------------------------------------------------------------------------------------------------------------------------------------------
  `enabled`                 Yes        `true`    Enables/Disables the Athena Partitioner Lambda function
  `enable_custom_metrics`   No         `false`   Enables/Disables logging of metrics for the Athena Partitioner Lambda function
  `log_level`               No         `info`    The log level for the Lambda function, can be either `info` or `debug`. Debug will help with diagnosing errors with polling SQS or sending Athena queries.
  `memory`                  No         `128`     The amount of memory (in MB) allocated to the Lambda function
  `timeout`                 No         `60`      The maximum duration of the Lambda function (in seconds)
  `file_format`             Yes        `null`    The alerts and data format stored in S3 bucket via Firehose, can be either `parquet` (preferred) or `json`
  `buckets`                 No         `{}`      Key value pairs of S3 buckets and associated Athena table names. By default, the alerts bucket will exist in each deployment.

**Example:**

``` json
{
  "athena_partitioner_config": {
    "log_level": "info",
    "memory": 128,
    "buckets": {
      "alternative_bucket": "data"
    },
    "file_format": "parquet",
    "timeout": 60
  }
}
```

## Athena References

-   [Introduction to SQL](https://www.w3schools.com/sql/sql_intro.asp)
-   [Amazon Athena Getting
    Started](https://docs.aws.amazon.com/athena/latest/ug/getting-started.html)
-   [Presto Documenation](https://prestodb.io/docs/0.172/index.html#)

::: tip
::: title
Tip
:::

-   Alerts and data are partitioned by `dt` in the format
    `YYYY-MM-DD-hh`

-   To improve query performance, filter data within a specific
    partition or range of partitions

    ``` sql
    SELECT * FROM "<prefix>_streamalert"."alerts"
    WHERE dt BETWEEN 2020-02-28-00 AND 2020-02-29-00
    ```
:::

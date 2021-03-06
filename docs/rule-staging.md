# Rule Staging

Rule Staging allows dynamic toggling of rules from a staging to
production state, and vice versa. Staged rules will only send alerts for
historical retention, and the alerts will not be sent to any
user-defined outputs, such as Slack, PagerDuty, etc.

To ensure that new rules do not flood alerting outputs with a ton of
potential false positives, rules can be staged. After the initial
staging period, wherein a noisy rule is tuned to limit extra noise or
false positives, staged rules can be promoted.

When Rule Staging is enabled, new rules will, by default, be *staged*
upon a deploy of the Rules Engine Lambda function. See the [Skip Staging
During Deploy](#skip-staging-during-deploy) section for more
information.

## Enabling Rule Staging

By default, the rule staging feature is not enabled. It can be enabled
with the following command:

``` bash
python manage.py rule-staging enable --true
```

The change will be reflected in the `conf/globals.json` file.

For additional configuration options related to this feature, see the
[Rule Staging](config-global.html#rule-staging) section of the Global
Settings.

The initial implementation of the Rule Staging feature has a hard-coded
\'staging period\', or the time a rule should remain in staging before
being auto-promoted to send to user-defined outputs. This is only
relevant if the [Rule Promotion](rule-promotion.html) feature is also
enabled. The current default is 48 hours.

## CLI Commands

There are a few CLI commands available to make management of staged
rules easier.

### Rule Status

The status of rules, meaning whether or not they are staged, can be
determined with the following command:

``` bash
python manage.py rule-staging status
```

**Sample Output**:

    Rule                                     Staged?
      1: rule_001                            False
      2: rule_002                            True
      3: rule_003                            False
      4: rule_004                            False

### Toggling Staged Status

Staging a rule, or list of rules, is possible with the following
command:

``` bash
python manage.py rule-staging stage <rule_001> <rule_002>
```

Unstaging rules, enabling them to send to all user-defined outputs, is
equally as easy and accomplished with the following command:

``` bash
python manage.py rule-staging unstage <rule_001> <rule_002>
```

### Skip Staging During Deploy

As noted above, all new rules will be *staged* by default during a Rules
Engine deploy when the Rule Staging feature is enabled. There may,
however, be occasions when all new rules should not be staged during a
deploy. To allow for this, the Rules Engine can be deployed with the
following command:

``` bash
python manage.py deploy --functions rule --skip-rule-staging
```

This will force all new rules to send to user-defined outputs
immediately upon deploy, bypassing the default staging period.
Alternatively, the `--stage-rules` and `--unstage-rules` flags can be
used (instead of the `--skip-rule-staging` flag) to stage or unstage
specific rules only.

## Triaging Staged Rules

Once a rule is in staging, alerts generated by that rule can be queried
in Athena:

``` sql
SELECT 'rule_001' as rule_name, count(*) AS alert_count FROM alerts WHERE dt >= '2018-07-25-16' AND rule_name = 'rule_001' AND staged = True
```

  --------------------------------------------------------------------------
  rule_name                                                    alert_count
  ------------------------------------------------------------ -------------
  rule_001                                                     96

  --------------------------------------------------------------------------

  : Athena Results

To help automate triaging of staged rules, StreamAlert includes an
optional Rule Promotion Lambda function. This function can both send
alert digests via email and auto-promote rules out of staging. See the
[Rule Promotion](rule-promotion.html) page for more detail.

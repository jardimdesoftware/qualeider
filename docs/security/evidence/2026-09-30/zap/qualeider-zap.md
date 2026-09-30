# ZAP Scanning Report

ZAP by [Checkmarx](https://checkmarx.com/).


## Summary of Alerts

| Risk Level | Number of Alerts |
| --- | --- |
| High | 0 |
| Medium | 1 |
| Low | 9 |
| Informational | 7 |




## Insights

| Level | Reason | Site | Description | Statistic |
| --- | --- | --- | --- | --- |
| Low | Warning |  | ZAP warnings logged - see the zap.log file for details | 1    |
| Info | Informational | https://qualeider.valerialima.me | Percentage of responses with status code 2xx | 85 % |
| Info | Informational | https://qualeider.valerialima.me | Percentage of responses with status code 3xx | 8 % |
| Info | Informational | https://qualeider.valerialima.me | Percentage of responses with status code 4xx | 5 % |
| Info | Informational | https://qualeider.valerialima.me | Percentage of endpoints with content type application/javascript | 56 % |
| Info | Informational | https://qualeider.valerialima.me | Percentage of endpoints with content type font/woff2 | 6 % |
| Info | Informational | https://qualeider.valerialima.me | Percentage of endpoints with content type image/svg+xml | 6 % |
| Info | Informational | https://qualeider.valerialima.me | Percentage of endpoints with content type text/css | 3 % |
| Info | Informational | https://qualeider.valerialima.me | Percentage of endpoints with content type text/html | 25 % |
| Info | Informational | https://qualeider.valerialima.me | Percentage of endpoints with content type text/plain | 3 % |
| Info | Informational | https://qualeider.valerialima.me | Percentage of endpoints with method GET | 100 % |
| Info | Informational | https://qualeider.valerialima.me | Count of total endpoints | 32    |







## Alerts

| Name | Risk Level | Number of Instances |
| --- | --- | --- |
| Content Security Policy (CSP) Header Not Set | Medium | Systemic |
| Big Redirect Detected (Potential Sensitive Information Leak) | Low | 2 |
| Cross-Origin-Embedder-Policy Header Missing or Invalid | Low | 4 |
| Cross-Origin-Opener-Policy Header Missing or Invalid | Low | 4 |
| Cross-Origin-Resource-Policy Header Missing or Invalid | Low | Systemic |
| Permissions Policy Header Not Set | Low | Systemic |
| Server Leaks Information via "X-Powered-By" HTTP Response Header Field(s) | Low | Systemic |
| Server Leaks Version Information via "Server" HTTP Response Header Field | Low | Systemic |
| Strict-Transport-Security Header Not Set | Low | Systemic |
| Timestamp Disclosure - Unix | Low | 2 |
| Authentication Request Identified | Informational | 1 |
| Information Disclosure - Sensitive Information in URL | Informational | 3 |
| Modern Web Application | Informational | 3 |
| Non-Storable Content | Informational | 3 |
| Re-examine Cache-control Directives | Informational | Systemic |
| Storable and Cacheable Content | Informational | Systemic |
| Storable but Non-Cacheable Content | Informational | 1 |




## Alert Detail



### [ Content Security Policy (CSP) Header Not Set ](https://www.zaproxy.org/docs/alerts/10038/)



##### Medium (High)

### Description

Content Security Policy (CSP) is an added layer of security that helps to detect and mitigate certain types of attacks, including Cross Site Scripting (XSS) and data injection attacks. These attacks are used for everything from data theft to site defacement or distribution of malware. CSP provides a set of standard HTTP headers that allow website owners to declare approved sources of content that browsers should be allowed to load on that page — covered types are JavaScript, CSS, HTML frames, fonts, images and embeddable objects such as Java applets, ActiveX, audio and video files.

* URL: https://qualeider.valerialima.me
  * Node Name: `https://qualeider.valerialima.me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: https://qualeider.valerialima.me/forgotPassword
  * Node Name: `https://qualeider.valerialima.me/forgotPassword`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: https://qualeider.valerialima.me/login
  * Node Name: `https://qualeider.valerialima.me/login`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: https://qualeider.valerialima.me/robots.txt
  * Node Name: `https://qualeider.valerialima.me/robots.txt`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: https://qualeider.valerialima.me/sitemap.xml
  * Node Name: `https://qualeider.valerialima.me/sitemap.xml`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: ``

Instances: Systemic


### Solution

Ensure that your web server, application server, load balancer, etc. is configured to set the Content-Security-Policy header.

### Reference


* [ https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP ](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
* [ https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html ](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
* [ https://www.w3.org/TR/CSP/ ](https://www.w3.org/TR/CSP/)
* [ https://w3c.github.io/webappsec-csp/ ](https://w3c.github.io/webappsec-csp/)
* [ https://web.dev/articles/csp ](https://web.dev/articles/csp)
* [ https://caniuse.com/#feat=contentsecuritypolicy ](https://caniuse.com/#feat=contentsecuritypolicy)
* [ https://content-security-policy.com/ ](https://content-security-policy.com/)


#### CWE Id: [ 693 ](https://cwe.mitre.org/data/definitions/693.html)


#### WASC Id: 15

#### Source ID: 3

### [ Big Redirect Detected (Potential Sensitive Information Leak) ](https://www.zaproxy.org/docs/alerts/10044/)



##### Low (Medium)

### Description

The server has responded with a redirect that seems to provide a large response. This may indicate that although the server sent a redirect it also responded with body content (which may include sensitive details, PII, etc.).

* URL: https://qualeider.valerialima.me
  * Node Name: `https://qualeider.valerialima.me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: `Location header URI length: 6 [/login].
Predicted response size: 306.
Response Body Length: 6,655.`
* URL: https://qualeider.valerialima.me/
  * Node Name: `https://qualeider.valerialima.me/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: `Location header URI length: 6 [/login].
Predicted response size: 306.
Response Body Length: 6,655.`


Instances: 2

### Solution

Ensure that no sensitive information is leaked via redirect responses. Redirect responses should have almost no content.

### Reference



#### CWE Id: [ 201 ](https://cwe.mitre.org/data/definitions/201.html)


#### WASC Id: 13

#### Source ID: 3

### [ Cross-Origin-Embedder-Policy Header Missing or Invalid ](https://www.zaproxy.org/docs/alerts/90004/)



##### Low (Medium)

### Description

Cross-Origin-Embedder-Policy header is a response header that prevents a document from loading any cross-origin resources that don't explicitly grant the document permission (using CORP or CORS).

* URL: https://qualeider.valerialima.me
  * Node Name: `https://qualeider.valerialima.me`
  * Method: `GET`
  * Parameter: `Cross-Origin-Embedder-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: https://qualeider.valerialima.me/createAccount
  * Node Name: `https://qualeider.valerialima.me/createAccount`
  * Method: `GET`
  * Parameter: `Cross-Origin-Embedder-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: https://qualeider.valerialima.me/forgotPassword
  * Node Name: `https://qualeider.valerialima.me/forgotPassword`
  * Method: `GET`
  * Parameter: `Cross-Origin-Embedder-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: https://qualeider.valerialima.me/login
  * Node Name: `https://qualeider.valerialima.me/login`
  * Method: `GET`
  * Parameter: `Cross-Origin-Embedder-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``


Instances: 4

### Solution

Ensure that the application/web server sets the Cross-Origin-Embedder-Policy header appropriately, and that it sets the Cross-Origin-Embedder-Policy header to 'require-corp' for documents.
If possible, ensure that the end user uses a standards-compliant and modern web browser that supports the Cross-Origin-Embedder-Policy header (https://caniuse.com/mdn-http_headers_cross-origin-embedder-policy).

### Reference


* [ https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy ](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy)


#### CWE Id: [ 693 ](https://cwe.mitre.org/data/definitions/693.html)


#### WASC Id: 14

#### Source ID: 3

### [ Cross-Origin-Opener-Policy Header Missing or Invalid ](https://www.zaproxy.org/docs/alerts/90004/)



##### Low (Medium)

### Description

Cross-Origin-Opener-Policy header is a response header that allows a site to control if others included documents share the same browsing context. Sharing the same browsing context with untrusted documents might lead to data leak.

* URL: https://qualeider.valerialima.me
  * Node Name: `https://qualeider.valerialima.me`
  * Method: `GET`
  * Parameter: `Cross-Origin-Opener-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: https://qualeider.valerialima.me/createAccount
  * Node Name: `https://qualeider.valerialima.me/createAccount`
  * Method: `GET`
  * Parameter: `Cross-Origin-Opener-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: https://qualeider.valerialima.me/forgotPassword
  * Node Name: `https://qualeider.valerialima.me/forgotPassword`
  * Method: `GET`
  * Parameter: `Cross-Origin-Opener-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: https://qualeider.valerialima.me/login
  * Node Name: `https://qualeider.valerialima.me/login`
  * Method: `GET`
  * Parameter: `Cross-Origin-Opener-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``


Instances: 4

### Solution

Ensure that the application/web server sets the Cross-Origin-Opener-Policy header appropriately, and that it sets the Cross-Origin-Opener-Policy header to 'same-origin' for documents.
'same-origin-allow-popups' is considered as less secured and should be avoided.
If possible, ensure that the end user uses a standards-compliant and modern web browser that supports the Cross-Origin-Opener-Policy header (https://caniuse.com/mdn-http_headers_cross-origin-opener-policy).

### Reference


* [ https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Opener-Policy ](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Opener-Policy)


#### CWE Id: [ 693 ](https://cwe.mitre.org/data/definitions/693.html)


#### WASC Id: 14

#### Source ID: 3

### [ Cross-Origin-Resource-Policy Header Missing or Invalid ](https://www.zaproxy.org/docs/alerts/90004/)



##### Low (Medium)

### Description

Cross-Origin-Resource-Policy header is an opt-in header designed to counter side-channels attacks like Spectre. Resource should be specifically set as shareable amongst different origins.

* URL: https://qualeider.valerialima.me
  * Node Name: `https://qualeider.valerialima.me`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: https://qualeider.valerialima.me/_next/static/chunks/169no08td-7sh.js
  * Node Name: `https://qualeider.valerialima.me/_next/static/chunks/169no08td-7sh.js`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: https://qualeider.valerialima.me/_next/static/chunks/2jd64prymsfrn.css
  * Node Name: `https://qualeider.valerialima.me/_next/static/chunks/2jd64prymsfrn.css`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: https://qualeider.valerialima.me/forgotPassword
  * Node Name: `https://qualeider.valerialima.me/forgotPassword`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: https://qualeider.valerialima.me/login
  * Node Name: `https://qualeider.valerialima.me/login`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``

Instances: Systemic


### Solution

Ensure that the application/web server sets the Cross-Origin-Resource-Policy header appropriately, and that it sets the Cross-Origin-Resource-Policy header to 'same-origin' for all web pages.
'same-site' is considered as less secured and should be avoided.
If resources must be shared, set the header to 'cross-origin'.
If possible, ensure that the end user uses a standards-compliant and modern web browser that supports the Cross-Origin-Resource-Policy header (https://caniuse.com/mdn-http_headers_cross-origin-resource-policy).

### Reference


* [ https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy ](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy)


#### CWE Id: [ 693 ](https://cwe.mitre.org/data/definitions/693.html)


#### WASC Id: 14

#### Source ID: 3

### [ Permissions Policy Header Not Set ](https://www.zaproxy.org/docs/alerts/10063/)



##### Low (Medium)

### Description

Permissions Policy Header is an added layer of security that helps to restrict from unauthorized access or usage of browser/client features by web resources. This policy ensures the user privacy by limiting or specifying the features of the browsers can be used by the web resources. Permissions Policy provides a set of standard HTTP headers that allow website owners to limit which features of browsers can be used by the page such as camera, microphone, location, full screen etc.

* URL: https://qualeider.valerialima.me
  * Node Name: `https://qualeider.valerialima.me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: https://qualeider.valerialima.me/forgotPassword
  * Node Name: `https://qualeider.valerialima.me/forgotPassword`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: https://qualeider.valerialima.me/login
  * Node Name: `https://qualeider.valerialima.me/login`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: https://qualeider.valerialima.me/robots.txt
  * Node Name: `https://qualeider.valerialima.me/robots.txt`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: https://qualeider.valerialima.me/sitemap.xml
  * Node Name: `https://qualeider.valerialima.me/sitemap.xml`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: ``

Instances: Systemic


### Solution

Ensure that your web server, application server, load balancer, etc. is configured to set the Permissions-Policy header.

### Reference


* [ https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy ](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy)
* [ https://developer.chrome.com/blog/feature-policy/ ](https://developer.chrome.com/blog/feature-policy/)
* [ https://scotthelme.co.uk/a-new-security-header-feature-policy/ ](https://scotthelme.co.uk/a-new-security-header-feature-policy/)
* [ https://w3c.github.io/webappsec-feature-policy/ ](https://w3c.github.io/webappsec-feature-policy/)
* [ https://www.smashingmagazine.com/2018/12/feature-policy/ ](https://www.smashingmagazine.com/2018/12/feature-policy/)


#### CWE Id: [ 693 ](https://cwe.mitre.org/data/definitions/693.html)


#### WASC Id: 15

#### Source ID: 3

### [ Server Leaks Information via "X-Powered-By" HTTP Response Header Field(s) ](https://www.zaproxy.org/docs/alerts/10037/)



##### Low (Medium)

### Description

The web/application server is leaking information via one or more "X-Powered-By" HTTP response headers. Access to such information may facilitate attackers identifying other frameworks/components your web application is reliant upon and the vulnerabilities such components may be subject to.

* URL: https://qualeider.valerialima.me
  * Node Name: `https://qualeider.valerialima.me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `X-Powered-By: Next.js`
  * Other Info: ``
* URL: https://qualeider.valerialima.me/
  * Node Name: `https://qualeider.valerialima.me/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `X-Powered-By: Next.js`
  * Other Info: ``
* URL: https://qualeider.valerialima.me/login
  * Node Name: `https://qualeider.valerialima.me/login`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `X-Powered-By: Next.js`
  * Other Info: ``
* URL: https://qualeider.valerialima.me/robots.txt
  * Node Name: `https://qualeider.valerialima.me/robots.txt`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `X-Powered-By: Next.js`
  * Other Info: ``
* URL: https://qualeider.valerialima.me/sitemap.xml
  * Node Name: `https://qualeider.valerialima.me/sitemap.xml`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `X-Powered-By: Next.js`
  * Other Info: ``

Instances: Systemic


### Solution

Ensure that your web server, application server, load balancer, etc. is configured to suppress "X-Powered-By" headers.

### Reference


* [ https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/01-Information_Gathering/08-Fingerprint_Web_Application_Framework ](https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/01-Information_Gathering/08-Fingerprint_Web_Application_Framework)
* [ https://www.troyhunt.com/shhh-dont-let-your-response-headers/ ](https://www.troyhunt.com/shhh-dont-let-your-response-headers/)


#### CWE Id: [ 497 ](https://cwe.mitre.org/data/definitions/497.html)


#### WASC Id: 13

#### Source ID: 3

### [ Server Leaks Version Information via "Server" HTTP Response Header Field ](https://www.zaproxy.org/docs/alerts/10036/)



##### Low (High)

### Description

The web/application server is leaking version information via the "Server" HTTP response header. Access to such information may facilitate attackers identifying other vulnerabilities your web/application server is subject to.

* URL: https://qualeider.valerialima.me
  * Node Name: `https://qualeider.valerialima.me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `nginx/1.24.0 (Ubuntu)`
  * Other Info: ``
* URL: https://qualeider.valerialima.me/
  * Node Name: `https://qualeider.valerialima.me/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `nginx/1.24.0 (Ubuntu)`
  * Other Info: ``
* URL: https://qualeider.valerialima.me/login
  * Node Name: `https://qualeider.valerialima.me/login`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `nginx/1.24.0 (Ubuntu)`
  * Other Info: ``
* URL: https://qualeider.valerialima.me/robots.txt
  * Node Name: `https://qualeider.valerialima.me/robots.txt`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `nginx/1.24.0 (Ubuntu)`
  * Other Info: ``
* URL: https://qualeider.valerialima.me/sitemap.xml
  * Node Name: `https://qualeider.valerialima.me/sitemap.xml`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `nginx/1.24.0 (Ubuntu)`
  * Other Info: ``

Instances: Systemic


### Solution

Ensure that your web server, application server, load balancer, etc. is configured to suppress the "Server" header or provide generic details.

### Reference


* [ https://httpd.apache.org/docs/current/mod/core.html#servertokens ](https://httpd.apache.org/docs/current/mod/core.html#servertokens)
* [ https://learn.microsoft.com/en-us/previous-versions/msp-n-p/ff648552(v=pandp.10) ](https://learn.microsoft.com/en-us/previous-versions/msp-n-p/ff648552(v=pandp.10))
* [ https://www.troyhunt.com/shhh-dont-let-your-response-headers/ ](https://www.troyhunt.com/shhh-dont-let-your-response-headers/)


#### CWE Id: [ 497 ](https://cwe.mitre.org/data/definitions/497.html)


#### WASC Id: 13

#### Source ID: 3

### [ Strict-Transport-Security Header Not Set ](https://www.zaproxy.org/docs/alerts/10035/)



##### Low (High)

### Description

HTTP Strict Transport Security (HSTS) is a web security policy mechanism whereby a web server declares that complying user agents (such as a web browser) are to interact with it using only secure HTTPS connections (i.e. HTTP layered over TLS/SSL). HSTS is an IETF standards track protocol and is specified in RFC 6797.

* URL: https://qualeider.valerialima.me
  * Node Name: `https://qualeider.valerialima.me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: https://qualeider.valerialima.me/_next/static/chunks/2jd64prymsfrn.css
  * Node Name: `https://qualeider.valerialima.me/_next/static/chunks/2jd64prymsfrn.css`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: https://qualeider.valerialima.me/login
  * Node Name: `https://qualeider.valerialima.me/login`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: https://qualeider.valerialima.me/robots.txt
  * Node Name: `https://qualeider.valerialima.me/robots.txt`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: https://qualeider.valerialima.me/sitemap.xml
  * Node Name: `https://qualeider.valerialima.me/sitemap.xml`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: ``

Instances: Systemic


### Solution

Ensure that your web server, application server, load balancer, etc. is configured to enforce Strict-Transport-Security.

### Reference


* [ https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html ](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html)
* [ https://owasp.org/www-community/Security_Headers ](https://owasp.org/www-community/Security_Headers)
* [ https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security ](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security)
* [ https://caniuse.com/stricttransportsecurity ](https://caniuse.com/stricttransportsecurity)
* [ https://datatracker.ietf.org/doc/html/rfc6797 ](https://datatracker.ietf.org/doc/html/rfc6797)


#### CWE Id: [ 319 ](https://cwe.mitre.org/data/definitions/319.html)


#### WASC Id: 15

#### Source ID: 3

### [ Timestamp Disclosure - Unix ](https://www.zaproxy.org/docs/alerts/10096/)



##### Low (Low)

### Description

A timestamp was disclosed by the application/web server. - Unix

* URL: https://qualeider.valerialima.me/api/auth/google
  * Node Name: `https://qualeider.valerialima.me/api/auth/google`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `1854721961`
  * Other Info: `1854721961, which evaluates to: 2028-10-09 16:32:41.`
* URL: https://qualeider.valerialima.me/api/auth/google
  * Node Name: `https://qualeider.valerialima.me/api/auth/google`
  * Method: `GET`
  * Parameter: `Location`
  * Attack: ``
  * Evidence: `1854721961`
  * Other Info: `1854721961, which evaluates to: 2028-10-09 16:32:41.`


Instances: 2

### Solution

Manually confirm that the timestamp data is not sensitive, and that the data cannot be aggregated to disclose exploitable patterns.

### Reference


* [ https://cwe.mitre.org/data/definitions/200.html ](https://cwe.mitre.org/data/definitions/200.html)


#### CWE Id: [ 497 ](https://cwe.mitre.org/data/definitions/497.html)


#### WASC Id: 13

#### Source ID: 3

### [ Authentication Request Identified ](https://www.zaproxy.org/docs/alerts/10111/)



##### Informational (High)

### Description

The given request has been identified as an authentication request. The 'Other Info' field contains a set of key=value lines which identify any relevant fields. If the request is in a context which has an Authentication Method set to "Auto-Detect" then this rule will change the authentication to match the request identified.

* URL: https://qualeider.valerialima.me/login%3Femail=zaproxy%2540example.com&password=ZAP
  * Node Name: `https://qualeider.valerialima.me/login (email,password)`
  * Method: `GET`
  * Parameter: `email`
  * Attack: ``
  * Evidence: `password`
  * Other Info: `userParam=email
userValue=zaproxy@example.com
passwordParam=password
referer=https://qualeider.valerialima.me/login`


Instances: 1

### Solution

This is an informational alert rather than a vulnerability and so there is nothing to fix.

### Reference


* [ https://www.zaproxy.org/docs/desktop/addons/authentication-helper/auth-req-id/ ](https://www.zaproxy.org/docs/desktop/addons/authentication-helper/auth-req-id/)



#### Source ID: 3

### [ Information Disclosure - Sensitive Information in URL ](https://www.zaproxy.org/docs/alerts/10024/)



##### Informational (Medium)

### Description

The request appeared to contain sensitive information leaked in the URL. This can violate PCI and most organizational compliance policies. You can configure the list of strings for this check to add or remove values specific to your environment.

* URL: https://qualeider.valerialima.me/forgotPassword%3Femail=zaproxy%2540example.com
  * Node Name: `https://qualeider.valerialima.me/forgotPassword (email)`
  * Method: `GET`
  * Parameter: `email`
  * Attack: ``
  * Evidence: `zaproxy@example.com`
  * Other Info: `The URL contains email address(es).`
* URL: https://qualeider.valerialima.me/login%3Femail=zaproxy%2540example.com&password=ZAP
  * Node Name: `https://qualeider.valerialima.me/login (email,password)`
  * Method: `GET`
  * Parameter: `email`
  * Attack: ``
  * Evidence: `zaproxy@example.com`
  * Other Info: `The URL contains email address(es).`
* URL: https://qualeider.valerialima.me/login%3Femail=zaproxy%2540example.com&password=ZAP
  * Node Name: `https://qualeider.valerialima.me/login (email,password)`
  * Method: `GET`
  * Parameter: `password`
  * Attack: ``
  * Evidence: `password`
  * Other Info: `The URL contains potentially sensitive information. The following string was found via the pattern: pass
password`


Instances: 3

### Solution

Do not pass sensitive information in URIs.

### Reference



#### CWE Id: [ 598 ](https://cwe.mitre.org/data/definitions/598.html)


#### WASC Id: 13

#### Source ID: 3

### [ Modern Web Application ](https://www.zaproxy.org/docs/alerts/10109/)



##### Informational (Medium)

### Description

The application appears to be a modern web application. If you need to explore it automatically then the Client Spider may well be more effective than the standard one.

* URL: https://qualeider.valerialima.me
  * Node Name: `https://qualeider.valerialima.me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `<script src="/_next/static/chunks/089okgz-_etsf.js" async=""></script>`
  * Other Info: `No links have been found while there are scripts, which is an indication that this is a modern web application.`
* URL: https://qualeider.valerialima.me/
  * Node Name: `https://qualeider.valerialima.me/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `<script src="/_next/static/chunks/089okgz-_etsf.js" async=""></script>`
  * Other Info: `No links have been found while there are scripts, which is an indication that this is a modern web application.`
* URL: https://qualeider.valerialima.me/createAccount
  * Node Name: `https://qualeider.valerialima.me/createAccount`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `<script src="/_next/static/chunks/089okgz-_etsf.js" async=""></script>`
  * Other Info: `No links have been found while there are scripts, which is an indication that this is a modern web application.`


Instances: 3

### Solution

This is an informational alert and so no changes are required.

### Reference




#### Source ID: 3

### [ Non-Storable Content ](https://www.zaproxy.org/docs/alerts/10049/)



##### Informational (Medium)

### Description

The response contents are not storable by caching components such as proxy servers. If the response does not contain sensitive, personal or user-specific information, it may benefit from being stored and cached, to improve performance.

* URL: https://qualeider.valerialima.me/api/auth/google
  * Node Name: `https://qualeider.valerialima.me/api/auth/google`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `302`
  * Other Info: ``
* URL: https://qualeider.valerialima.me/robots.txt
  * Node Name: `https://qualeider.valerialima.me/robots.txt`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `no-store`
  * Other Info: ``
* URL: https://qualeider.valerialima.me/sitemap.xml
  * Node Name: `https://qualeider.valerialima.me/sitemap.xml`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `no-store`
  * Other Info: ``


Instances: 3

### Solution

The content may be marked as storable by ensuring that the following conditions are satisfied:
The request method must be understood by the cache and defined as being cacheable ("GET", "HEAD", and "POST" are currently defined as cacheable)
The response status code must be understood by the cache (one of the 1XX, 2XX, 3XX, 4XX, or 5XX response classes are generally understood)
The "no-store" cache directive must not appear in the request or response header fields
For caching by "shared" caches such as "proxy" caches, the "private" response directive must not appear in the response
For caching by "shared" caches such as "proxy" caches, the "Authorization" header field must not appear in the request, unless the response explicitly allows it (using one of the "must-revalidate", "public", or "s-maxage" Cache-Control response directives)
In addition to the conditions above, at least one of the following conditions must also be satisfied by the response:
It must contain an "Expires" header field
It must contain a "max-age" response directive
For "shared" caches such as "proxy" caches, it must contain a "s-maxage" response directive
It must contain a "Cache Control Extension" that allows it to be cached
It must have a status code that is defined as cacheable by default (200, 203, 204, 206, 300, 301, 404, 405, 410, 414, 501).

### Reference


* [ https://datatracker.ietf.org/doc/html/rfc7234 ](https://datatracker.ietf.org/doc/html/rfc7234)
* [ https://datatracker.ietf.org/doc/html/rfc7231 ](https://datatracker.ietf.org/doc/html/rfc7231)
* [ https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html ](https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html)


#### CWE Id: [ 524 ](https://cwe.mitre.org/data/definitions/524.html)


#### WASC Id: 13

#### Source ID: 3

### [ Re-examine Cache-control Directives ](https://www.zaproxy.org/docs/alerts/10015/)



##### Informational (Low)

### Description

The cache-control header has not been set properly or is missing, allowing the browser and proxies to cache content. For static assets like css, js, or image files this might be intended, however, the resources should be reviewed to ensure that no sensitive content will be cached.

* URL: https://qualeider.valerialima.me
  * Node Name: `https://qualeider.valerialima.me`
  * Method: `GET`
  * Parameter: `cache-control`
  * Attack: ``
  * Evidence: `s-maxage=31536000`
  * Other Info: ``
* URL: https://qualeider.valerialima.me/createAccount
  * Node Name: `https://qualeider.valerialima.me/createAccount`
  * Method: `GET`
  * Parameter: `cache-control`
  * Attack: ``
  * Evidence: `s-maxage=31536000`
  * Other Info: ``
* URL: https://qualeider.valerialima.me/forgotPassword
  * Node Name: `https://qualeider.valerialima.me/forgotPassword`
  * Method: `GET`
  * Parameter: `cache-control`
  * Attack: ``
  * Evidence: `s-maxage=31536000`
  * Other Info: ``
* URL: https://qualeider.valerialima.me/login
  * Node Name: `https://qualeider.valerialima.me/login`
  * Method: `GET`
  * Parameter: `cache-control`
  * Attack: ``
  * Evidence: `s-maxage=31536000`
  * Other Info: ``
* URL: https://qualeider.valerialima.me/login%3Femail=zaproxy%2540example.com&password=ZAP
  * Node Name: `https://qualeider.valerialima.me/login (email,password)`
  * Method: `GET`
  * Parameter: `cache-control`
  * Attack: ``
  * Evidence: `s-maxage=31536000`
  * Other Info: ``

Instances: Systemic


### Solution

For secure content, ensure the cache-control HTTP header is set with "no-cache, no-store, must-revalidate". If an asset should be cached consider setting the directives "public, max-age, immutable".

### Reference


* [ https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html#web-content-caching ](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html#web-content-caching)
* [ https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control ](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)
* [ https://grayduck.mn/2021/09/13/cache-control-recommendations/ ](https://grayduck.mn/2021/09/13/cache-control-recommendations/)


#### CWE Id: [ 525 ](https://cwe.mitre.org/data/definitions/525.html)


#### WASC Id: 13

#### Source ID: 3

### [ Storable and Cacheable Content ](https://www.zaproxy.org/docs/alerts/10049/)



##### Informational (Medium)

### Description

The response contents are storable by caching components such as proxy servers, and may be retrieved directly from the cache, rather than from the origin server by the caching servers, in response to similar requests from other users. If the response data is sensitive, personal or user-specific, this may result in sensitive information being leaked. In some cases, this may even result in a user gaining complete control of the session of another user, depending on the configuration of the caching components in use in their environment. This is primarily an issue where "shared" caching servers such as "proxy" caches are configured on the local network. This configuration is typically found in corporate or educational environments, for instance.

* URL: https://qualeider.valerialima.me
  * Node Name: `https://qualeider.valerialima.me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `s-maxage=31536000`
  * Other Info: ``
* URL: https://qualeider.valerialima.me/
  * Node Name: `https://qualeider.valerialima.me/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `s-maxage=31536000`
  * Other Info: ``
* URL: https://qualeider.valerialima.me/_next/static/chunks/2jd64prymsfrn.css
  * Node Name: `https://qualeider.valerialima.me/_next/static/chunks/2jd64prymsfrn.css`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `max-age=31536000`
  * Other Info: ``
* URL: https://qualeider.valerialima.me/forgotPassword
  * Node Name: `https://qualeider.valerialima.me/forgotPassword`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `s-maxage=31536000`
  * Other Info: ``
* URL: https://qualeider.valerialima.me/login
  * Node Name: `https://qualeider.valerialima.me/login`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `s-maxage=31536000`
  * Other Info: ``

Instances: Systemic


### Solution

Validate that the response does not contain sensitive, personal or user-specific information. If it does, consider the use of the following HTTP response headers, to limit, or prevent the content being stored and retrieved from the cache by another user:
Cache-Control: no-cache, no-store, must-revalidate, private
Pragma: no-cache
Expires: 0
This configuration directs both HTTP 1.0 and HTTP 1.1 compliant caching servers to not store the response, and to not retrieve the response (without validation) from the cache, in response to a similar request.

### Reference


* [ https://datatracker.ietf.org/doc/html/rfc7234 ](https://datatracker.ietf.org/doc/html/rfc7234)
* [ https://datatracker.ietf.org/doc/html/rfc7231 ](https://datatracker.ietf.org/doc/html/rfc7231)
* [ https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html ](https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html)


#### CWE Id: [ 524 ](https://cwe.mitre.org/data/definitions/524.html)


#### WASC Id: 13

#### Source ID: 3

### [ Storable but Non-Cacheable Content ](https://www.zaproxy.org/docs/alerts/10049/)



##### Informational (Medium)

### Description

The response contents are storable by caching components such as proxy servers, but will not be retrieved directly from the cache, without validating the request upstream, in response to similar requests from other users.

* URL: https://qualeider.valerialima.me/icon.svg%3Ficon.0ooh8j4nsdzt5.svg
  * Node Name: `https://qualeider.valerialima.me/icon.svg (icon.0ooh8j4nsdzt5.svg)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `max-age=0`
  * Other Info: ``


Instances: 1

### Solution



### Reference


* [ https://datatracker.ietf.org/doc/html/rfc7234 ](https://datatracker.ietf.org/doc/html/rfc7234)
* [ https://datatracker.ietf.org/doc/html/rfc7231 ](https://datatracker.ietf.org/doc/html/rfc7231)
* [ https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html ](https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html)


#### CWE Id: [ 524 ](https://cwe.mitre.org/data/definitions/524.html)


#### WASC Id: 13

#### Source ID: 3



# upstream
A data framework for Javascript/Typescript based clients and services.

This project is just starting out, so it's evolving quickly!  Some of the features we're targeting:
* An asynchronous graph model of data. [in progress]
* Pluggable data caching policies [in progress]
* A routing, dependency mapping, and transformation pipeline [in progress]
* Data sources independent of transformation pipeline
* Pluggable data sources (HTTP, local storage, client package assets, etc)
* Writable models with downstream push notifications

# Why?
If you squint your eyes, many services follow a similar pattern.

1. identify the entity that is being requested (routing)
2. gather data from upstream sources (read from DB, make an upstream HTTP request, read from a local file, etc)
3. reducing upstream data into the entities format (includes projecting, transforming, joining, etc)
4. caching the result based on some policy

For example, in an express/nodejs based service it might look like this:

1. a route is defined to identify a given url (/books/:id)
2. the route handler looks up the book and it's associated reviews in dynamodb
3. the route handler transforms and joins the json blobs it got from dynamodb into the xml schema that this service responds with.

Well constructed client applications often follow a simlar process at a high level.

1. A viewmodel is bound to some UI
2. The viewmodel is based on some upstream data - it must gather that data
3. The ui needs a string of text, but the upstream data is a Book, select the Book's title as the text (projection).

Upstream attempts to provide the scafolding for doing this process, such that the same system can work on either the client or the services.
It is independent of the underlying data sources and transport mechansims so you spend less time doing boilerplate stuff, and more time
solving whatever domain specific problem you have.


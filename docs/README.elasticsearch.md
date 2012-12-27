elasticsearch
=============

This will install and enable/start the [elasticsearch][] service.  It
will install [elasticsearch][] to _/opt_.  It may be desirable to make
this configurable via _files/vars.yml_.  Another todo item is to create
a _stop.yml_ to stop and remove [elasticsearch][].  Handlers also need
to be created in case new configuration files are copied into place.

The included configuration files are one for service startup
(_elasticsearch.conf_), configure the service itself, and _pam_ file to
make sure the _elasticsearch_ user can open enough files.

For more information on [elasticsearch][], please see:

* http://www.elasticsearch.org/guide/
* http://www.elasticsearch.org/tutorials/
* http://www.elasticsearch.org/tutorials/2012/05/19/elasticsearch-for-logging.html
* http://www.elasticsearch.org/tutorials/2010/07/01/setting-up-elasticsearch.html
* http://www.elasticsearch.org/tutorials/2011/02/22/running-elasticsearch-as-a-non-root-user.html
* http://www.elasticsearch.org/tutorials/2011/04/06/too-many-open-files.html

[elasticsearch]: http://www.elasticsearch.org/

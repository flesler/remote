deploy:
	git push -f git@heroku.com:browser-remote.git HEAD:master 

.PHONY: deploy
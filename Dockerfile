FROM kshire:builder

COPY . .

RUN mv cmd/*.sh /usr/bin && \
	rm -rf cmd

EXPOSE ${SERVER_PORT}

ENTRYPOINT ["/usr/bin/entrypoint.sh"]

CMD ["npm", "run", "watch"]

# Situs statis, tanpa build step: file langsung disajikan oleh nginx.
FROM nginx:stable-alpine

COPY . /usr/share/nginx/html
RUN mv /usr/share/nginx/html/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

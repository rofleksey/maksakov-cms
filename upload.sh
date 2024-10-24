set -e
docker build . -t rofleksey/maksakov-cms:latest
docker push rofleksey/maksakov-cms:latest

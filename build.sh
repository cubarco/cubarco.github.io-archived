#!/bin/sh
set -e

echo "Starting the Jekyll Action"

BUILD_DIR=/tmp/_site
echo "::debug::Local branch is ${LOCAL_BRANCH}"
mkdir ${BUILD_DIR}

# 1. Build jekyll
if [ "${USE_TAG}" = true ]; then
    COMMIT_TAG_NAME=$(date "+%Y-%m%d-%H%M%S-$RANDOM")
    echo "TAG_NAME: $COMMIT_TAG_NAME"
    sed -i "s/COMMIT_TAG_NAME/$COMMIT_TAG_NAME/g" ./_config.yml
fi

JEKYLL_ENV=production bundle exec jekyll build -d ${BUILD_DIR}
echo "Jekyll build done"

if [ "${BUILD_ONLY}" = true ]; then
  exit $?
fi

if [ "${PURGECSS}" = true ]; then
    npm install purgecss
    ./node_modules/.bin/purgecss --css ${BUILD_DIR}/assets/css/main.css --content ${BUILD_DIR}/**/*.html --content ${BUILD_DIR}/**/*.js --output ${BUILD_DIR}/assets/css
fi

# 2. Publish
cd ${BUILD_DIR}
LOCAL_BRANCH=main
git init -b ${LOCAL_BRANCH}

# No need to have GitHub Pages to run Jekyll
touch .nojekyll

remote_branch="gh-pages"
echo "Publishing to ${GITHUB_REPOSITORY} on branch ${remote_branch}"

REMOTE_REPO="https://${GITHUB_ACTOR}:${TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
if [ "${USE_TAG}" = true ]; then
    git config user.name "${GITHUB_ACTOR}" && \
    git config user.email "${GITHUB_ACTOR}@users.noreply.github.com" && \
    git add . && \
    git commit -m "jekyll build from Action ${GITHUB_SHA}" && \
    git tag -a $COMMIT_TAG_NAME -m "Used by jsdelivr CDN." && \
    git push --follow-tags --force $REMOTE_REPO $LOCAL_BRANCH:$remote_branch && \
    rm -fr .git
else
    git config user.name "${GITHUB_ACTOR}" && \
    git config user.email "${GITHUB_ACTOR}@users.noreply.github.com" && \
    git add . && \
    git commit -m "jekyll build from Action ${GITHUB_SHA}" && \
    git push --force $REMOTE_REPO $LOCAL_BRANCH:$remote_branch && \
    rm -fr .git
fi

exit $?

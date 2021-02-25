yum install ruby23-devel.x86_64 libxslt-devel libxml2-devel && \
    gem install jekyll bundler && \
    export NOKOGIRI_USE_SYSTEM_LIBRARIES=true && \
    export BUNDLE_GEMFILE=$PWD/Gemfile && \
    ruby --version && bundle --version && gem --version && \
    bundle install --jobs=3 --retry=3 --deployment && \
    JEKYLL_ENV=production bundle exec jekyll build && \
    tar zcf _site/archived.tar.gz _site/*

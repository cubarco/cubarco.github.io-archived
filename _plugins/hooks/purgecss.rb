Jekyll::Hooks.register(:site, :post_write) do |_site|
  system("purgecss --css #{_site.dest}/assets/css/main.css --content #{_site.dest}/**/*.html  --output #{_site.dest}/assets/css")
end

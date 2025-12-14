# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

- Deprecate `UrlParamsService.init()` in favor of `registerRoute()`,
  `urlParamsRoute` directive, or `URL_PARAMS_REGISTER_ROUTE_PROVIDER`.
  `init()` remains available for backward compatibility but may be removed
  in a future major release. (See migration notes in README.)

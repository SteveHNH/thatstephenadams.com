---
title: "{{ replace .Name "-" " " | title }}"
date: {{ .Date }}
draft: true

categories: ["blog"]
tags: []
toc: false
author: "Stephen"
---

{{ with .File }}{{ end }}
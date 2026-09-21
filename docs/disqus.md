# Disqus comments

Comments are opt-in and appear only on written posts under `/post/`.

## One-time setup

1. Create or select the site's forum in [Disqus](https://disqus.com/admin/create/).
2. Copy the forum's shortname and put it in `hugo.toml`:

   ```toml
   [params.comments.disqus]
     shortname = "your-forum-shortname"
   ```

3. In Disqus Admin, set the forum appearance color scheme to **Auto** so the embedded thread follows the visitor's light or dark preference.
4. Configure moderation before publishing: review the community rules, moderation level, blocked words/users, and notification settings.

Leave `shortname` empty to disable comments completely; Hugo then emits no comment markup or Disqus script.

The site styles the outer comments frame, but Disqus owns the embedded iframe. On the free plan, Disqus branding and advertising remain, and custom site CSS cannot alter the thread's internal UI. See [Disqus appearance customizations](https://help.disqus.com/en/articles/1717201-disqus-appearance-customizations) for its available controls.

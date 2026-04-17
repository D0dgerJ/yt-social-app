1. docker compose up -d
2. восстановление БД:
   docker exec -i yt-postgres psql -U dodgerj ytsocial < backup.sql
3. восстановление uploads:
   tar -xzf uploads.tar.gz -C /volume
4. nginx restart:
   systemctl restart nginx

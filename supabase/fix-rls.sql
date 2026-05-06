-- reviews: čtení pro všechny (veřejné profily tatérů)
DROP POLICY IF EXISTS "reviews_select_public" ON reviews;
CREATE POLICY "reviews_select_public" ON reviews
  FOR SELECT USING (true);

-- reviews: vkládání jen pro přihlášené klienty
DROP POLICY IF EXISTS "reviews_insert_client" ON reviews;
CREATE POLICY "reviews_insert_client" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = client_id);

-- bookings: tatér vidí svoje rezervace
DROP POLICY IF EXISTS "bookings_select_artist" ON bookings;
CREATE POLICY "bookings_select_artist" ON bookings
  FOR SELECT USING (auth.uid() = artist_id OR auth.uid() = client_id);

-- bookings: klient může vytvořit rezervaci
DROP POLICY IF EXISTS "bookings_insert_client" ON bookings;
CREATE POLICY "bookings_insert_client" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = client_id);

-- bookings: tatér může měnit status
DROP POLICY IF EXISTS "bookings_update_artist" ON bookings;
CREATE POLICY "bookings_update_artist" ON bookings
  FOR UPDATE USING (auth.uid() = artist_id);

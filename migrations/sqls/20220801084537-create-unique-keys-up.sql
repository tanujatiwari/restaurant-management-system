/* Replace with your SQL commands */
alter table dishes add constraint unique_dish unique(restaurant_id,name);
alter table restaurants add constraint unique_rest unique(user_id,name);
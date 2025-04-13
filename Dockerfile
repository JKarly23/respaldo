FROM docker.prod.uci.cu/fortes/akademos/mes/ak-mes-base:latest


#ENV DEBIAN_FRONTEND=noninteractive

#COPY sources.list /etc/apt/sources.list

#RUN apt update \
#    && apt install -y --no-install-recommends --allow-remove-essential openssh-client curl zip unzip gettext nano gnupg \
#    && apt -f install \
#    && rm -rf /var/lib/apt/lists/*

#USER root

WORKDIR /var/www/html

COPY . ./

#RUN apt update \
#    #&& apt-get -f install \
#    && apt install -y --no-install-recommends libpq-dev libc-client-dev \
#    && a2enmod rewrite \
#    #&& docker-php-ext-install pdo_mysql pdo_pgsql pgsql exif pcntl bcmath  \
#    && rm -rf /var/lib/apt/lists/*


#COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/
#RUN install-php-extensions  pdo_pgsql pgsql exif pcntl bcmath ldap imap


#COPY composer.* ./
# Get latest Composer
#COPY --from=composer:lts /usr/bin/composer /usr/local/bin/composer
#RUN php -d memory_limit=-1 /usr/local/bin/composer install

#RUN ln -fs /usr/share/zoneinfo/America/Havana /etc/localtime && dpkg-reconfigure -f noninteractive tzdata

VOLUME /var/www/html
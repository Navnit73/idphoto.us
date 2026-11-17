---
# OWNER REVIEW: every claim below matches the code as of 2026-10-23. Before adding any
# of these, make them true first and then update this page: a stated deletion window for
# image files at PixPassport/Cloudinary (e.g. 24 hours), a "delete now" button, signed or
# expiring download links, a named payment provider and its PCI-DSS level, encryption at
# rest, and compliance claims (GDPR, CCPA). Leave out marketing stats and competitor tables.
title: "Data Security: How We Protect Your Photos"
heading: "Data security"
description: "How idphoto.us protects your passport and ID photos: encrypted connections, metadata removal, automatic deletion, no data sales, and no AI training."
slug: data-security
category: legal
template: info
breadcrumbLabel: "Data security"
updatedAt: 2026-11-17
relatedPages:
  - /privacy-policy
  - /terms
  - /tool/passport-photo-editor
faq:
  - question: "Is it safe to upload my passport photo?"
    answer: "Your photo travels only over encrypted HTTPS connections, and your browser strips hidden metadata such as location before uploading it. It's used only to make your passport or ID photo, and it's never sold or used to train AI models."
  - question: "How long do you keep my photo?"
    answer: "Your result page, and our record of it, is deleted automatically 7 days after you make your photo. After that, the result page stops working and we can't recover it, so download your photo promptly."
  - question: "Do you store my card details?"
    answer: "No. When you pay to download your photo, you enter card details with our payment provider, not on our servers. We receive only a confirmation that the payment succeeded and the details needed to record your purchase and send your invoice."
  - question: "Can your staff see my photo?"
    answer: "Processing is automated. We don't look at your photo unless you ask us to in a support request, for example to check why a photo didn't process correctly."
  - question: "Will my photo be used to train AI or facial recognition?"
    answer: "No. We don't use your photos to train AI models, build datasets, or develop facial recognition."
---

Passport and ID photos show your face clearly, so you should know exactly what happens to them. This page explains how we protect your photos and personal details. Our [privacy policy](/privacy-policy) has the full details of what we collect.

## Encrypted connections

Every page, upload, and download on idphoto.us uses HTTPS, which encrypts the data travelling between your device and our servers. Our site tells browsers to always use HTTPS (HSTS), so they won't connect to it over an unencrypted connection. Photos sent from our server to our photo processing provider are also sent over encrypted connections.

## Less data leaves your device

Before uploading, your browser re-saves your photo, and shrinks it if it's very large. This removes hidden metadata, such as the location where the photo was taken and the device it was taken on. We only accept JPEG, PNG, and WebP images up to a set size, and we check every upload on our server.

## Temporary storage and automatic deletion

We keep your photo only as long as you need it to view and download the result.

- Your result page has a long, random link that can't practically be guessed.
- The result page and our record of it are deleted automatically 7 days after you make your photo.
- Once deleted, your result can't be recovered by you or by us, so download your photo promptly.

## Payment security

Uploading and previewing your photo is free, but downloading it is a paid purchase. When you pay, you enter card details with our payment provider, not on idphoto.us. Your card number, security code, and bank details never reach our servers, and we don't store them. We receive only what we need to confirm and record your purchase, such as the amount, currency, and your email address for the invoice.

## Your data is not for sale

- We never sell, rent, or share your photos, email address, or other personal information with advertisers, data brokers, or marketing companies.
- We don't use advertising or analytics cookies, and our pages don't load third-party tracking or ad scripts.
- We never use your photos to train AI models, build datasets, or develop facial recognition.
- We share data only with the service providers that help us run the site, such as our host and photo processing provider, and only to provide the service. Our [privacy policy](/privacy-policy) lists them.

## Limited access

Photo processing is automated. We don't look at your photo unless you ask us to in a support request. We store IP addresses only as one-way hashes, which we use to stop spam and abuse, and access to our database is restricted.

## No system is perfect

No method of sending or storing data is completely secure, and we can't promise that it is. We work to keep our safeguards current. If you believe you've found a security problem, please tell us through our [contact page](/contact).

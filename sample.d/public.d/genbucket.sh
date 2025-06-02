#!/bin/sh

mkdir -p ./tmp.d

genb0() {

	jq -c -n '{name:"fuji",  height:3.776}' >./tmp.d/b0j0.json
	jq -c -n '{name:"takao", height:0.599}' >./tmp.d/b0j1.json

	cat ./tmp.d/b0j[01].json | gzip --fast >./tmp.d/b0jsonl.raw.dat
	b0jsz=$(cat ./tmp.d/b0jsonl.raw.dat | wc -c)
	printf '%x' ${b0jsz} | xxd -r -ps >./tmp.d/b0jsonl.len.dat
	printf '\x04' |
		cat \
			/dev/stdin \
			./tmp.d/b0jsonl.len.dat \
			./tmp.d/b0jsonl.raw.dat \
			>./tmp.d/b0jsonl.asn1.der.dat

	ls ./tmp.d/b0j[01].json |
		cut -d/ -f3 |
		gzip --fast \
			>./tmp.d/b0names.raw.dat
	b0nsz=$(cat ./tmp.d/b0names.raw.dat | wc -c)
	printf '%x' ${b0nsz} | xxd -r -ps >./tmp.d/b0names.len.dat
	printf '\x04' |
		cat \
			/dev/stdin \
			./tmp.d/b0names.len.dat \
			./tmp.d/b0names.raw.dat \
			>./tmp.d/b0names.asn1.der.dat

	cat \
		./tmp.d/b0names.asn1.der.dat \
		./tmp.d/b0jsonl.asn1.der.dat \
		>./tmp.d/b0.namedjson.raw.dat
	b0sz=$(cat ./tmp.d/b0.namedjson.raw.dat | wc -c)
	printf '%x' ${b0sz} | xxd -r -ps >./tmp.d/b0.namedjson.len.dat
	printf '\x30' |
		cat \
			/dev/stdin \
			./tmp.d/b0.namedjson.len.dat \
			./tmp.d/b0.namedjson.raw.dat \
			>./tmp.d/b0.namedjson.asn1.der.dat

}

genb1() {

	jq -c -n '{name:"FUJI",  height:3.776}' >./tmp.d/b1j0.json
	jq -c -n '{name:"TAKAO", height:0.599}' >./tmp.d/b1j1.json

	cat ./tmp.d/b1j[01].json | gzip --fast >./tmp.d/b1jsonl.raw.dat
	b1jsz=$(cat ./tmp.d/b1jsonl.raw.dat | wc -c)
	printf '%x' ${b1jsz} | xxd -r -ps >./tmp.d/b1jsonl.len.dat
	printf '\x04' |
		cat \
			/dev/stdin \
			./tmp.d/b1jsonl.len.dat \
			./tmp.d/b1jsonl.raw.dat \
			>./tmp.d/b1jsonl.asn1.der.dat

	ls ./tmp.d/b1j[01].json |
		cut -d/ -f3 |
		gzip --fast \
			>./tmp.d/b1names.raw.dat
	b1nsz=$(cat ./tmp.d/b1names.raw.dat | wc -c)
	printf '%x' ${b1nsz} | xxd -r -ps >./tmp.d/b1names.len.dat
	printf '\x04' |
		cat \
			/dev/stdin \
			./tmp.d/b1names.len.dat \
			./tmp.d/b1names.raw.dat \
			>./tmp.d/b1names.asn1.der.dat

	cat \
		./tmp.d/b1names.asn1.der.dat \
		./tmp.d/b1jsonl.asn1.der.dat \
		>./tmp.d/b1.namedjson.raw.dat
	b1sz=$(cat ./tmp.d/b1.namedjson.raw.dat | wc -c)
	printf '%x' ${b1sz} | xxd -r -ps >./tmp.d/b1.namedjson.len.dat
	printf '\x30' |
		cat \
			/dev/stdin \
			./tmp.d/b1.namedjson.len.dat \
			./tmp.d/b1.namedjson.raw.dat \
			>./tmp.d/b1.namedjson.asn1.der.dat

}

geninput() {
  echo generating input zip file...

	genb0
	genb1

	ls ./tmp.d/b[01].namedjson.asn1.der.dat |
		zip \
			-@ \
			-T \
			-v \
			-o \
			./buckets.zip
}

test -f ./buckets.zip || geninput

package main

import (
  "flag"
  "fmt"
  "log"
  "math/rand"
  "net/http"
  "strconv"
  "time"
)

func serveTest(w http.ResponseWriter, r *http.Request) {
  fmt.Fprintf(w, "{}")
}

var chunk1K []rune
var kAlphabet = []rune("abcdefghijklmnopqrstuvwxyz0123456789")

func generateExplicitRandomData(n int) string {
  b := make([]rune, n)
  for i := range b {
      b[i] = kAlphabet[rand.Intn(len(kAlphabet))]
  }
  return string(b)
}

func generateRandomData(n int) string {
  if chunk1K == nil {
    chunk1K = []rune(generateExplicitRandomData(1000))
  }

  b := make([]rune, n)
  i := 0
  for i+1000 < n {
    copy(b[i:i+1000], chunk1K)
    i += 1000
  }
  if i < n {
    copy(b[i:n], []rune(generateExplicitRandomData(n-i)))
  }
  return string(b)
}

var dataCache map[int]string

func main() {
  fHost := flag.String("host", "0.0.0.0", "port to serve on")
  fPort := flag.Int("port", 8000, "port to serve on")
  fStaticFileDir := flag.String("static_root", "../dist/app", "port to serve on")
  flag.Parse()

  dataCache = make(map[int]string)
  rand.Seed(time.Now().UnixNano())

  // Seed cache with values on the 10s
  //log.Printf("seeding test data")
  //for _, n := range []int{1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9} {
  //  log.Printf("seeding %d bytes", n)
  //  dataCache[n] = generateRandomData(n)
  //}

  http.HandleFunc("/api/test", func (w http.ResponseWriter, r *http.Request) {
    //log.Printf("serving test data")
    numBytes := 1000
    sizeStr := r.URL.Query().Get("size")
    if len(sizeStr) > 0 {
      var err error
      numBytes, err = strconv.Atoi(sizeStr)
      if err != nil {
        panic(err)
      }
    }
    var data string
    if v, ok := dataCache[numBytes]; ok {
      data = v
    } else {
      log.Printf("seeding %d bytes", numBytes)
      data = generateRandomData(numBytes)
      dataCache[numBytes] = data
    }
    fmt.Fprintf(w, "%s", data)
  })
  http.Handle("/", http.FileServer(http.Dir(*fStaticFileDir)))

  host := fmt.Sprintf("%s:%d", *fHost, *fPort)
  log.Printf("serving on %s", host)
  log.Fatal(http.ListenAndServe(host, nil))
}


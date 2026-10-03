package com.cerebro.api.attachments;

import com.cerebro.api.shared.DeletionImpact;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** {@code AttachmentRepository}. */
@RestController
@RequestMapping("/api/attachments")
@Tag(name = "Ek dosyalar")
public class AttachmentController {

  private final AttachmentService service;

  public AttachmentController(AttachmentService service) {
    this.service = service;
  }

  @GetMapping
  public List<Attachment> list(@RequestParam String ownerType, @RequestParam long ownerId) {
    return service.list(ownerType, ownerId);
  }

  @GetMapping("/counts")
  public Map<Long, Integer> counts(@RequestParam String ownerType) {
    return service.countByOwner(ownerType);
  }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public Attachment upload(
      @RequestParam String ownerType,
      @RequestParam long ownerId,
      @RequestParam String documentType,
      @RequestParam(defaultValue = "") String description,
      @RequestParam(required = false) String fileName,
      @RequestPart("file") MultipartFile file)
      throws IOException {
    return service.upload(
        ownerType,
        ownerId,
        documentType,
        description,
        fileName != null ? fileName : file.getOriginalFilename(),
        file.getContentType(),
        file.getBytes());
  }

  @PutMapping("/{id}")
  public Attachment update(@PathVariable long id, @RequestBody Attachment.Update input) {
    return service.update(id, input);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable long id) {
    service.remove(id);
  }

  @GetMapping("/{id}/deletion-impact")
  public DeletionImpact deletionImpact(@PathVariable long id) {
    return service.deletionImpact(id);
  }

  /** The bytes, always as a download (never rendered by the API origin). */
  @GetMapping("/{id}/content")
  public ResponseEntity<byte[]> content(@PathVariable long id) {
    AttachmentService.Download download = service.download(id);
    Attachment attachment = download.attachment();
    return ResponseEntity.ok()
        .contentType(mediaType(attachment.contentType()))
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            ContentDisposition.attachment()
                .filename(attachment.fileName(), StandardCharsets.UTF_8)
                .build()
                .toString())
        .header("X-Content-Type-Options", "nosniff")
        .body(download.content());
  }

  private static MediaType mediaType(String contentType) {
    try {
      return MediaType.parseMediaType(contentType);
    } catch (org.springframework.util.InvalidMimeTypeException e) {
      return MediaType.APPLICATION_OCTET_STREAM;
    }
  }
}

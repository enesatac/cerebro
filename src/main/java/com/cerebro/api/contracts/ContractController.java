package com.cerebro.api.contracts;

import com.cerebro.api.shared.DeletionImpact;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** {@code ContractRepository} and {@code VendorRepository}. */
@RestController
@RequestMapping("/api")
@Tag(name = "Satın alma ve sözleşmeler")
public class ContractController {

  private final ContractService service;

  public ContractController(ContractService service) {
    this.service = service;
  }

  @GetMapping("/contracts")
  public List<Contract> list(
      @RequestParam(required = false) Long projectId,
      @RequestParam(required = false) Long vendorId) {
    return service.list(projectId, vendorId);
  }

  @GetMapping("/contracts/{id}")
  public Contract get(@PathVariable long id) {
    return service.get(id);
  }

  @PostMapping("/contracts")
  @ResponseStatus(HttpStatus.CREATED)
  public Contract create(@RequestBody Contract.Input input) {
    return service.create(input);
  }

  @PutMapping("/contracts/{id}")
  public Contract update(@PathVariable long id, @RequestBody Contract.Input input) {
    return service.update(id, input);
  }

  @DeleteMapping("/contracts/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable long id) {
    service.remove(id);
  }

  @GetMapping("/contracts/{id}/deletion-impact")
  public DeletionImpact deletionImpact(@PathVariable long id) {
    return service.deletionImpact(id);
  }

  @GetMapping("/vendors")
  public List<Vendor> vendors() {
    return service.vendors();
  }

  @PostMapping("/vendors")
  @ResponseStatus(HttpStatus.CREATED)
  public Vendor createVendor(@RequestBody Vendor.Input input) {
    return service.createVendor(input);
  }

  @PutMapping("/vendors/{id}")
  public Vendor updateVendor(@PathVariable long id, @RequestBody Vendor.Input input) {
    return service.updateVendor(id, input);
  }

  @DeleteMapping("/vendors/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteVendor(@PathVariable long id) {
    service.removeVendor(id);
  }

  @GetMapping("/vendors/{id}/deletion-impact")
  public DeletionImpact vendorDeletionImpact(@PathVariable long id) {
    return service.vendorDeletionImpact(id);
  }
}
